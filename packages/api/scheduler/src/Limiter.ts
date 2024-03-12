/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { RetryOptions, TaskArguments, TaskAsPromise, wrapOnRetry } from '@mdf.js/utils';
import EventEmitter from 'events';
import { cloneDeep, merge } from 'lodash';
import { setTimeout as waitFor } from 'timers/promises';
import { v4 } from 'uuid';

import { Crash, Multi } from '@mdf.js/crash';
import { Queue } from './Queue';
import {
  ConsolidatedLimiterOptions,
  DEFAULT_JOB_TYPE,
  DEFAULT_OPTIONS,
  DEFAULT_PRIORITY,
  DEFAULT_WEIGHT,
  LimiterOptions,
  LimiterState,
  TaskHandler,
  TaskHeaders,
  TaskOptions,
  TaskResult,
} from './types';

export interface Limiter extends EventEmitter {
  /** Emitted when a job is done, with or without errors */
  on(event: 'done', listener: (uuid: string, result: TaskResult, error?: Multi) => void): this;
  /** Emitted when a job is done, with or without errors */
  on(event: string, listener: (data: any, error?: Multi) => void): this;
}
/**
 * A limiter is a queue system that allows you to control the rate of job processing. It can be used
 * to limit the number of concurrent jobs, the delay between each job, the maximum number of jobs in
 * the queue, and the strategy to use when the queue length reaches highWater.
 */
export class Limiter extends EventEmitter {
  /** Limiter queue of tasks */
  private readonly queue: Queue;
  /** The limiter options */
  private readonly _options: ConsolidatedLimiterOptions;
  /** The actual number of concurrent jobs */
  private concurrency: number;
  /** The limiter state */
  private limiterState: LimiterState;
  /**
   * Create a new instance of Limiter
   * @param options - The limiter options
   */
  constructor(options?: LimiterOptions) {
    super();
    this._options = merge(cloneDeep(DEFAULT_OPTIONS), options);
    this.checkOptions(this._options);
    this.limiterState = this._options.autoStart ? LimiterState.IDLE : LimiterState.STOPPED;
    this.concurrency = 0;
    this.queue = new Queue(this._options);
    this.queue.on('enqueue', this.startIfIdle.bind(this));
    this.queue.on('refill', this.nextJobExecution.bind(this));
  }
  /**
   * Schedules a task to be executed by the limiter
   * @param task - The task to schedule
   * @param taskArgs - The arguments for the task
   * @param options - The options for the job
   * @returns The task handler
   */
  public schedule<T>(
    task: TaskAsPromise<T>,
    taskArgs?: TaskArguments,
    options?: TaskOptions
  ): string | undefined {
    const handler = this.addJobToQueue(task, taskArgs, options);
    if (!handler) {
      return undefined;
    }
    const onDone = (uuid: string, result: T, error?: Multi) => {
      this.emit('done', uuid, result, error);
      this.emit(handler.jobUserId, handler.data, handler.errors);
    };
    handler.once('done', onDone);
    return handler.jobUserId;
  }
  /**
   * Executes a task and returns a promise that resolves when the task is done
   * @param task - The task to execute
   * @param taskArgs - The arguments for the task
   * @param options - The options for the job
   * @returns A promise that resolves when the task is done
   */
  public async execute<T>(
    task: TaskAsPromise<T>,
    taskArgs?: TaskArguments,
    options?: TaskOptions
  ): Promise<T> {
    const handler = this.addJobToQueue(task, taskArgs, options);
    if (!handler) {
      throw new Crash('The job could not be scheduled', { name: 'JobSchedulingError' });
    }
    return new Promise((resolve, reject) => {
      const onDone = (uuid: string, result: T, error?: Multi) => {
        if (error) {
          reject(error);
        } else {
          resolve(handler.data as T);
        }
        this.emit('done', uuid, result, error);
        this.emit(handler.jobUserId, handler.data, handler.errors);
      };
      handler.once('done', onDone);
    });
  }
  /** Starts the limiter */
  public start(): void {
    if (this.limiterState === LimiterState.STOPPED) {
      this.limiterState = LimiterState.RUNNING;
      this.nextJobExecution.bind(this)();
    }
  }
  /** Stops the limiter */
  public stop(): void {
    this.limiterState = LimiterState.STOPPED;
  }
  /** Returns the number of jobs in the queue */
  public get size(): number {
    return this.queue.size;
  }
  /** Returns the number of pending jobs */
  public get pending(): number {
    return this.concurrency;
  }
  /** Clears the queue */
  public clear(): void {
    this.queue.clear();
  }
  /** Waits until the queue is empty */
  public async waitUntilEmpty(): Promise<void> {
    if (this.size === 0 && this.pending === 0) {
      return;
    }
    return new Promise(resolve => {
      const onEmpty = () => {
        if (this.size === 0 && this.pending === 0) {
          this.off('done', onEmpty);
          resolve();
        }
      };
      this.on('done', onEmpty);
      onEmpty();
    });
  }
  /**
   * Checks the options for the limiter and throws an error if they are invalid
   * @param options - The options to check
   */
  private checkOptions(options: LimiterOptions): void {
    if (
      typeof options.concurrency !== 'number' ||
      options.concurrency < 1 ||
      Number.isNaN(options.concurrency)
    ) {
      throw new Crash('The concurrency must be at least 1', { name: 'ValidationError' });
    }
    if (
      typeof options.delay !== 'number' ||
      options.delay < 0 ||
      Number.isNaN(options.delay) ||
      !Number.isFinite(options.delay)
    ) {
      throw new Crash('The delay should be a finite number greater than or equal to 0', {
        name: 'ValidationError',
      });
    }
    if (typeof options.autoStart !== 'boolean') {
      throw new Crash('The autoStart should be a boolean', { name: 'ValidationError' });
    }
  }
  /**
   * Adds a job to the queue
   * @param task - The task to schedule
   * @param taskArgs - The arguments for the task
   * @param options - The options for the job
   * @returns The task handler
   */
  private addJobToQueue<T>(
    task: TaskAsPromise<T>,
    taskArgs?: TaskArguments,
    options?: TaskOptions
  ): TaskHandler<T> | undefined {
    const { headers, id, retryOptions } = this.getJobOptions(options);
    const jobTask = wrapOnRetry(task, taskArgs, retryOptions);
    const job = new TaskHandler(id, jobTask, DEFAULT_JOB_TYPE, {
      headers,
    });
    if (this.queue.enqueue(job)) {
      return job;
    } else {
      return undefined;
    }
  }
  /**
   * Determines the job options
   * @param options - The options for the job
   * @returns The job options
   */
  private getJobOptions(options: TaskOptions = {}): {
    headers: TaskHeaders;
    id: string;
    retryOptions?: RetryOptions;
  } {
    return {
      headers: {
        priority: options.priority ?? DEFAULT_PRIORITY,
        weight: options.weight ?? DEFAULT_WEIGHT,
      },
      id: options.id || v4(),
      retryOptions: options.retryOptions || this._options.retryOptions,
    };
  }
  /** Starts the limiter if it's not running */
  private startIfIdle(): void {
    if (this.limiterState === LimiterState.IDLE) {
      this.limiterState = LimiterState.RUNNING;
      setImmediate(this.nextJobExecution.bind(this));
    }
  }
  /** Determines if it's possible to execute another job */
  private get isPossibleToExecuteAnotherJob(): boolean {
    if (this.limiterState === LimiterState.STOPPED) {
      return false;
    } else if (this.concurrency === this._options.concurrency) {
      return false;
    } else if (this.queue.size === 0) {
      this.limiterState = this.concurrency === 0 ? LimiterState.IDLE : LimiterState.EMPTY;
      return false;
    }
    this.limiterState = LimiterState.RUNNING;
    return true;
  }
  /** Executes the next job in the queue */
  private async nextJobExecution(): Promise<void> {
    if (!this.isPossibleToExecuteAnotherJob) {
      return;
    }
    const job = this.queue.dequeue();
    if (!job) {
      return;
    }
    this.concurrency++;
    // If the concurrency is the same as the options, we should await the job
    // Otherwise, we should just run the job and continue
    if (this.concurrency === this._options.concurrency) {
      await this.runJob(job);
    } else {
      this.runJob(job);
    }
    // If there's a delay, we should wait before executing the next job
    if (this._options.delay > 0) {
      await waitFor(this._options.delay);
    }
    this.nextJobExecution.bind(this)();
  }
  /**
   * Executes a job and handles the result
   * @param job - The job to execute
   */
  private async runJob<T>(job: TaskHandler<T>): Promise<void> {
    if (typeof job.data !== 'function') {
      job.addError(
        new Crash(`Unexpected error, expected a function but got ${typeof job.data}`, {
          name: 'TypeError',
        })
      );
      job.done();
    } else {
      try {
        job.data = await (job.data as () => Promise<T>)();
      } catch (rawError) {
        const error = Crash.from(rawError);
        job.addError(error);
      } finally {
        this.concurrency--;
        job.done();
      }
    }
  }
}
