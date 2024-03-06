/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Crash, Multi } from '@mdf.js/crash';
import EventEmitter from 'events';
import { merge } from 'lodash';
import {
  Bottleneck,
  DEFAULT_ID,
  DEFAULT_JOB_OPTIONS,
  DEFAULT_PRIORITY,
  JobOptions,
  MAX_PRIORITY,
  TaskArguments,
  TaskAsPromise,
} from '.';
import { States } from './States';
import {
  DropOptions,
  EVENTS,
  EventInfoDropped,
  EventInfoRetryable,
  JOB_STATUS,
  JobState,
} from './types';

/** Represents a job in the Bottleneck job queue */
export class Job<R = any> {
  /** The options for the job */
  private _options: Required<JobOptions>;
  /** he number of times the job has been retried */
  private _retryCount: number = 0;
  /** The promise representing the completion of the job */
  private readonly _promise: Promise<R>;
  /** The resolve function for the job promise */
  private _resolve: ((value: R | PromiseLike<R>) => void) | undefined;
  /** The reject function for the job promise */
  private _reject: ((reason?: Crash | Multi) => void) | undefined;

  /**
   * Creates a new instance of the Job class.
   * @param task - The task function to be executed.
   * @param args - The arguments to be passed to the task function.
   * @param options - The options for the job.
   * @param jobDefaults - The default options for the job.
   * @param rejectOnDrop - Flag indicating whether to reject the job promise when it is dropped.
   * @param events - The events object for triggering job events.
   * @param states - The states object for managing job states.
   */
  constructor(
    private readonly task: TaskAsPromise<R>,
    public readonly args: TaskArguments,
    options: JobOptions,
    private readonly rejectOnDrop: boolean,
    private readonly events: EventEmitter,
    private readonly states: States
  ) {
    this._options = this.sanitize(options);
    this._promise = new Promise<R>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }
  /**
   * Sanitizes the job options by merging them with the default job options
   * and ensuring that the priority and job ID are valid.
   *
   * @param options - The job options to sanitize.
   * @returns The sanitized job options.
   */
  private sanitize(options: JobOptions): Required<JobOptions> {
    const _options = merge({}, DEFAULT_JOB_OPTIONS, options);
    _options.priority = this.sanitizePriority(_options.priority);
    _options.id = this.sanitizeJobId(_options.id);
    return _options;
  }
  /**
   * Sanitizes the priority value by ensuring it falls within the valid range.
   * @param priority - The priority value to be sanitized.
   * @returns The sanitized priority value.
   */
  private sanitizePriority(priority: number): number {
    const _priority = ~~priority !== priority ? DEFAULT_PRIORITY : priority;
    if (_priority < 0) {
      return 0;
    } else if (_priority > MAX_PRIORITY) {
      return MAX_PRIORITY;
    } else {
      return _priority;
    }
  }
  /**
   * Sanitizes the job identifier by appending a random index if the identifier is the default
   * identifier.
   * @param id - The job identifier to sanitize.
   * @returns The sanitized job identifier.
   */
  private sanitizeJobId(id: string): string {
    return id === DEFAULT_ID ? `${DEFAULT_ID}-${Math.random().toString(36).slice(2)}` : id;
  }
  /**
   * Asserts that the job has the expected status, throwing an error if not.
   * @param expected - The expected status of the job.
   */
  private assertStatus(expected: JobState): void {
    const status = this.states.jobStatus(this._options.id);
    if (!(status === expected || (expected === JOB_STATUS.DONE && status === null))) {
      throw new Crash(
        `Invalid job status ${status}, expected ${expected}. Please open an issue at https://github.com/mytracontrol/mdf.js/issues`
      );
    }
  }
  /**
   * Drops the job and triggers the 'dropped' event.
   * @param options - The options for dropping the job.
   * @returns True if the job was successfully dropped, false otherwise.
   */
  public doDrop(options: DropOptions = {}): boolean {
    if (this.states.remove(this._options.id)) {
      if (this.rejectOnDrop) {
        const error = options.error
          ? Crash.from(options.error)
          : new Crash(options.message ?? 'This job has been dropped by Bottleneck');
        this.reject(error);
      }
      this.events.emit(EVENTS.DROPPED, this.eventInfoDropped);
      return true;
    } else {
      return false;
    }
  }
  /** Marks the job as received and triggers the 'received' event */
  public doReceive(): void {
    this.states.start(this._options.id);
    this.events.emit(EVENTS.RECEIVED, {
      args: this.args,
      options: this._options,
    });
  }
  /**
   * Queues the job and triggers the 'queued' event.
   * @param reachedHWM - Flag indicating whether the the queue high-water mark was reached
   * @param blocked - Flag indicating whether the queue is blocked.
   */
  public doQueue(reachedHWM: boolean, blocked: boolean): void {
    this.assertStatus(JOB_STATUS.RECEIVED);
    this.states.next(this._options.id);
    this.events.emit(EVENTS.QUEUED, {
      args: this.args,
      options: this._options,
      reachedHWM,
      blocked,
    });
  }
  /** Runs the job and triggers the 'scheduled' event */
  public doRun(): void {
    if (this._retryCount === 0) {
      this.assertStatus(JOB_STATUS.QUEUED);
      this.states.next(this._options.id);
    } else {
      this.assertStatus(JOB_STATUS.EXECUTING);
    }
    this.events.emit(EVENTS.SCHEDULED, {
      args: this.args,
      options: this._options,
    });
  }
  /**
   * Executes the job and handles the result or failure.
   * @param clearGlobalState - A function to clear the global state.
   * @param run - A function to run the job.
   * @param free - A function to free resources after the job is done.
   * @param chained - The chained Bottleneck instance, if any.
   * @returns The result of the job execution.
   */
  public async doExecute(
    clearGlobalState: () => boolean,
    run: (wait: number) => void,
    free: (jobOptions: Required<JobOptions>, eventInfo: EventInfoRetryable) => Promise<void>,
    chained?: Bottleneck
  ): Promise<void> {
    if (this._retryCount === 0) {
      this.assertStatus(JOB_STATUS.RUNNING);
      this.states.next(this._options.id);
    } else {
      this.assertStatus(JOB_STATUS.EXECUTING);
    }
    this.events.emit(EVENTS.EXECUTING, this.eventInfoRetryable);

    const task = chained
      ? chained.schedule(this._options, this.task, ...this.args)
      : this.task(...this.args);
    try {
      const passed = await task;
      if (clearGlobalState()) {
        this.doDone(this.eventInfoRetryable);
        await free(this._options, this.eventInfoRetryable);
        this.assertStatus(JOB_STATUS.DONE);
        this.resolve(passed);
      }
    } catch (rawError) {
      return this.onFailure(Crash.from(rawError), clearGlobalState, run, free);
    }
  }
  /**
   * Handles job expiration and failure.
   * @param clearGlobalState - A function to clear the global state.
   * @param run - A function to run the job.
   * @param free - A function to free resources after the job is done.
   * @returns A promise representing the job expiration handling.
   */
  public async doExpire(
    clearGlobalState: () => boolean,
    run: (wait: number) => void,
    free: (jobOptions: Required<JobOptions>, eventInfo: EventInfoRetryable) => Promise<void>
  ): Promise<void> {
    if (this.states.jobStatus(this._options.id) === JOB_STATUS.RUNNING) {
      this.states.next(this._options.id);
    }
    this.assertStatus(JOB_STATUS.EXECUTING);
    const error = new Crash(`This job timed out after ${this._options.expiration} ms.`);
    return this.onFailure(error, clearGlobalState, run, free);
  }
  /**
   * Handles job failure.
   * @param error - The error that caused the job failure.
   * @param eventInfo - The event information for the failure event.
   * @param clearGlobalState - A function to clear the global state.
   * @param run - A function to run the job.
   * @param free - A function to free resources after the job is done.
   * @returns A promise representing the job failure handling.
   */
  private async onFailure(
    error: Crash | Multi,
    clearGlobalState: () => boolean,
    run: (wait: number) => void,
    free: (jobOptions: Required<JobOptions>, eventInfo: EventInfoRetryable) => Promise<void>
  ): Promise<void> {
    let retry: number | undefined;
    let retryAfter: number;

    if (clearGlobalState()) {
      const retryPromise = new Promise<number | undefined>(resolve => {
        let timeout: NodeJS.Timeout | undefined;
        let answered = false;
        const onTimeout = () => {
          clearTimeout(timeout);
          timeout = undefined;
          answered = true;
          resolve(undefined);
        };
        const onCallBack = (time?: number) => {
          if (timeout) {
            clearTimeout(timeout);
            timeout = undefined;
          }
          if (!answered) {
            answered = true;
            resolve(time);
          }
        };
        timeout = setTimeout(onTimeout, 1000);
        this.events.emit(EVENTS.FAILED, error, this.eventInfoRetryable, onCallBack);
      });
      retry = await retryPromise;

      if (retry) {
        retryAfter = ~~retry;
        this.events.emit(
          EVENTS.RETRY,
          `Retrying ${this._options.id} after ${retryAfter} ms`,
          this.eventInfoRetryable
        );
        this._retryCount++;
        return run(retryAfter);
      } else {
        this.doDone(this.eventInfoRetryable);
        await free(this._options, this.eventInfoRetryable);
        this.assertStatus(JOB_STATUS.DONE);
        return this.reject(error);
      }
    }
  }
  /**
   * Handles job completion and triggers the 'done' event.
   * @param eventInfo - The event information for the completion event.
   * @returns A promise representing the job completion handling.
   */
  private async doDone(eventInfo: EventInfoRetryable): Promise<void> {
    this.assertStatus(JOB_STATUS.EXECUTING);
    this.states.next(this.options.id);
    this.events.emit(EVENTS.DONE, eventInfo);
  }
  /**
   * Returns the retryable event information.
   * @returns {@link EventInfoRetryable} The event information.
   */
  private get eventInfoRetryable(): EventInfoRetryable {
    return {
      args: this.args,
      options: this._options,
      retryCount: this._retryCount,
    };
  }
  /**
   * Returns an object containing information about the dropped event.
   * @returns {@link EventInfoDropped} The event information.
   */
  private get eventInfoDropped(): EventInfoDropped {
    return {
      args: this.args,
      options: this._options,
      task: this.task,
      promise: this._promise,
    };
  }
  /** Gets the promise representing the completion of the job */
  public get promise(): Promise<R> {
    return this._promise;
  }
  /** Gets the resolve function for the job promise */
  public get resolve(): (value: R | PromiseLike<R>) => void {
    if (!this._resolve) {
      throw new Crash('The job promise has already been resolved');
    }
    return this._resolve;
  }
  /** Gets the reject function for the job promise */
  public get reject(): (reason?: Crash | Multi) => void {
    if (!this._reject) {
      throw new Crash('The job promise has already been rejected');
    }
    return this._reject;
  }
  /**  Gets the options for the job */
  public get options(): Required<JobOptions> {
    return this._options;
  }
}
