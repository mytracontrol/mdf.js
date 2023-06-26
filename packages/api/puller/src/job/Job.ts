/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { DropOptions, JobEventInfo, JobOptions, JobOptionsComplete } from '.';
import { Bottleneck, DEFAULT_PRIORITY, NUM_PRIORITIES } from '../bottleneck';
import { BottleneckError } from '../bottleneckError';
import { Events } from '../events';
import { load } from '../parser';
import { States } from '../states';

/**
 * Represents a job in the Bottleneck job queue.
 */
export class Job {
  /** The underlying task function to be executed */
  private _task: any;
  /** The arguments to be passed to the task function */
  private _args: any;
  /** Flag indicating whether to reject the job promise when it is dropped */
  private _rejectOnDrop: boolean;
  /** The events object for triggering job events */
  private _events: Events;
  /** The states object for managing job states */
  private _states: States;
  /** The options for the job */
  private _options: JobOptionsComplete;
  /** he number of times the job has been retried */
  private _retryCount: number;

  /** The promise representing the completion of the job */
  public promise: any;
  /** The resolve function for the job promise */
  public resolve: any;
  /** The reject function for the job promise */
  public reject: any;

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
    task: any,
    args: any,
    options: JobOptions,
    jobDefaults: JobOptionsComplete,
    rejectOnDrop: boolean,
    events: Events,
    states: States
  ) {
    this._task = task;
    this._args = args;
    this._rejectOnDrop = rejectOnDrop;
    this._events = events;
    this._states = states;
    this._options = load(options, jobDefaults) as JobOptionsComplete;
    this._options.priority = this._sanitizePriority(this._options.priority);

    if (this._options.id === jobDefaults.id) {
      this._options.id = `${this._options.id}-${this._randomIndex()}`;
    }

    this.promise = new Promise<any>((_resolve: any, _reject: any) => {
      this.resolve = _resolve;
      this.reject = _reject;
    });

    this._retryCount = 0;
  }

  /**
   * Sanitizes the priority value by ensuring it falls within the valid range.
   * @param priority - The priority value to be sanitized.
   * @returns The sanitized priority value.
   */
  private _sanitizePriority(priority: number): number {
    const sProperty = ~~priority !== priority ? DEFAULT_PRIORITY : priority;

    if (sProperty < 0) {
      return 0;
    } else if (sProperty > NUM_PRIORITIES - 1) {
      return NUM_PRIORITIES - 1;
    } else {
      return sProperty;
    }
  }

  /**
   * Generates a random index string.
   * @returns The generated random index string.
   */
  private _randomIndex(): string {
    return Math.random().toString(36).slice(2);
  }

  /**
   * Drops the job and triggers the 'dropped' event.
   * @param options - The options for dropping the job.
   * @returns True if the job was successfully dropped, false otherwise.
   */
  public doDrop(options: DropOptions = {}): boolean {
    const message = options.message ?? 'This job has been dropped by Bottleneck';
    if (this._states.remove(this._options.id)) {
      if (this._rejectOnDrop) {
        this.reject(options.error ?? new BottleneckError(message));
      }

      this._events.trigger('dropped', {
        args: this._args,
        options: this._options,
        task: this._task,
        promise: this.promise,
      });
      return true;
    } else {
      return false;
    }
  }

  /**
   * Asserts that the job has the expected status, throwing an error if not.
   * @param expected - The expected status of the job.
   */
  private _assertStatus(expected: string): void {
    const status = this._states.jobStatus(this._options.id);

    if (!(status === expected || (expected === 'DONE' && status === null))) {
      throw new BottleneckError(
        `Invalid job status ${status}, expected ${expected}. ` +
          `Please open an issue at https://github.com/SGrondin/bottleneck/issues`
      );
    }
  }

  /** Marks the job as received and triggers the 'received' event */
  public doReceive(): void {
    this._states.start(this._options.id);
    this._events.trigger('received', {
      args: this._args,
      options: this._options,
    });
  }

  /**
   * Queues the job and triggers the 'queued' event.
   * @param reachedHWM - Flag indicating whether the the queue high-water mark was reached.
   * @param blocked - Flag indicating whether the queue is blocked.
   */
  public doQueue(reachedHWM: boolean, blocked: boolean): void {
    this._assertStatus('RECEIVED');
    this._states.next(this._options.id);
    this._events.trigger('queued', {
      args: this._args,
      options: this._options,
      reachedHWM,
      blocked,
    });
  }

  /** Runs the job and triggers the 'scheduled' event */
  public doRun(): void {
    if (this._retryCount === 0) {
      this._assertStatus('QUEUED');
      this._states.next(this._options.id);
    } else {
      this._assertStatus('EXECUTING');
    }

    this._events.trigger('scheduled', {
      args: this._args,
      options: this._options,
    });
  }

  /**
   * Executes the job and handles the result or failure.
   * @param chained - The chained Bottleneck instance, if any.
   * @param clearGlobalState - A function to clear the global state.
   * @param run - A function to run the job.
   * @param free - A function to free resources after the job is done.
   * @returns The result of the job execution.
   */
  public async doExecute(
    chained: Bottleneck | null,
    clearGlobalState: () => boolean,
    run: (...args: any[]) => any,
    free: (jobOptions: JobOptionsComplete, eventInfo: JobEventInfo) => Promise<void>
  ): Promise<any> {
    let passed: any;

    if (this._retryCount === 0) {
      this._assertStatus('RUNNING');
      this._states.next(this._options.id);
    } else {
      this._assertStatus('EXECUTING');
    }

    const eventInfo: JobEventInfo = {
      args: this._args,
      options: this._options,
      retryCount: this._retryCount,
    };
    this._events.trigger('executing', eventInfo);

    try {
      passed = await (chained != null
        ? chained.schedule(this._options, this._task, ...this._args)
        : this._task(...this._args));

      if (clearGlobalState()) {
        this.doDone(eventInfo);
        await free(this._options, eventInfo);
        this._assertStatus('DONE');
        return this.resolve(passed);
      }
    } catch (error) {
      return this._onFailure(error, eventInfo, clearGlobalState, run, free);
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
    run: (...args: any[]) => any,
    free: (jobOptions: JobOptionsComplete, eventInfo: JobEventInfo) => Promise<void>
  ): Promise<void> {
    if (this._states.jobStatus(this._options.id) === 'RUNNING') {
      this._states.next(this._options.id);
    }

    this._assertStatus('EXECUTING');

    const eventInfo: JobEventInfo = {
      args: this._args,
      options: this._options,
      retryCount: this._retryCount,
    };
    const error = new BottleneckError(`This job timed out after ${this._options.expiration} ms.`);
    return this._onFailure(error, eventInfo, clearGlobalState, run, free);
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
  private async _onFailure(
    error: any,
    eventInfo: JobEventInfo,
    clearGlobalState: () => boolean,
    run: (...args: any[]) => Promise<any>, //void?
    free: (jobOptions: JobOptionsComplete, eventInfo: JobEventInfo) => Promise<void>
  ): Promise<void> {
    let retry: number;
    let retryAfter: number;

    if (clearGlobalState()) {
      retry = await this._events.trigger('failed', error, eventInfo);

      if (retry != null) {
        retryAfter = ~~retry;

        this._events.trigger(
          'retry',
          `Retrying ${this._options.id} after ${retryAfter} ms`,
          eventInfo
        );

        this._retryCount++;
        return run(retryAfter);
      } else {
        this.doDone(eventInfo);

        await free(this._options, eventInfo);

        this._assertStatus('DONE');

        return this.reject(error);
      }
    }
  }

  /**
   * Handles job completion and triggers the 'done' event.
   * @param eventInfo - The event information for the completion event.
   * @returns A promise representing the job completion handling.
   */
  private doDone(eventInfo: any): Promise<void> {
    this._assertStatus('EXECUTING');
    this._states.next(this.options.id);
    return this._events.trigger('done', eventInfo);
  }

  /*
   * ---------------------------------------------------------------------------------------------
   * GETTERS
   * ---------------------------------------------------------------------------------------------
   */
  /**  Gets the options for the job */
  public get options(): JobOptionsComplete {
    return this._options;
  }
  /** Gets the arguments for the job */
  public get args(): any[] {
    return this._args;
  }
}
