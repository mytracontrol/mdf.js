/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { RetryOptions, TaskArguments, TaskAsPromise, wrapOnRetry } from '@mdf.js/utils';
import EventEmitter from 'events';
import { merge } from 'lodash';
import { v4 } from 'uuid';

import { Multi } from '@mdf.js/crash';
import { Queue } from './Queue';
import {
  ConsolidatedLimiterOptions,
  DEFAULT_JOB_TYPE,
  DEFAULT_OPTIONS,
  DEFAULT_PRIORITY,
  DEFAULT_WEIGHT,
  JobOptions,
  LimiterOptions,
  TaskHandler,
  TaskHeaders,
} from './types';

/**
 * A limiter is a queue system that allows you to control the rate of job processing. It can be used
 * to limit the number of concurrent jobs, the delay between each job, the maximum number of jobs in
 * the queue, and the strategy to use when the queue length reaches highWater.
 */
export class Limiter extends EventEmitter {
  /** Limiter queue of tasks */
  private readonly queue: Queue = new Queue();
  /** The limiter options */
  private readonly _options: ConsolidatedLimiterOptions;
  /** The interval timer for the rate limiter */
  private intervalTimer: NodeJS.Timeout | null = null;
  /** The actual bucket size */
  private actualBucketSize = 0;
  /**
   * Create a new instance of Limiter
   * @param options - The limiter options
   */
  constructor(options?: LimiterOptions) {
    super();
    this._options = merge(DEFAULT_OPTIONS, options);
    this.actualBucketSize = this._options.bucketSize;
    if (this._options.bucketSize > 0) {
      this.intervalTimer = setInterval(this.refillBucket, this._options.interval);
    }
  }
  /**
   * Schedules a task to be executed by the limiter
   * @param task - The task to schedule
   * @param taskArgs - The arguments for the task
   * @param options - The options for the job
   * @returns The task handler
   */
  public schedule<T>(task: TaskAsPromise<T>, taskArgs: TaskArguments, options: JobOptions): string {
    const handler = this.addJobToQueue(task, taskArgs, options);
    const onDone = (uuid: string, result: T, error?: Multi) => {
      this.emit('done', uuid, result, error);
    };
    handler.once('done', onDone);
    return handler.jobUserId;
  }

  public async consume<T>(
    task: TaskAsPromise<T>,
    taskArgs: TaskArguments,
    options: JobOptions
  ): Promise<T> {
    const handler = this.addJobToQueue(task, taskArgs, options);
    return new Promise((resolve, reject) => {
      const onDone = (uuid: string, result: T, error?: Multi) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      };
      handler.once('done', onDone);
    });
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
    taskArgs: TaskArguments,
    options: JobOptions
  ): TaskHandler<T> {
    const { headers, id, retryOptions } = this.getJobOptions(options);
    const jobTask = wrapOnRetry(task, taskArgs, retryOptions);
    const job = new TaskHandler(id, jobTask, DEFAULT_JOB_TYPE, {
      headers,
    });
    this.queue.enqueue(job);
    return job;
  }
  /**
   * Determines the job options
   * @param options - The options for the job
   * @returns The job options
   */
  private getJobOptions(options: JobOptions): {
    headers: TaskHeaders;
    id: string;
    retryOptions?: RetryOptions;
  } {
    const jobId = options.id || v4();
    const _retryOptions = options.retryOptions || this._options.retryOptions;
    const priority = options.priority ?? DEFAULT_PRIORITY;
    const weight = options.weight ?? DEFAULT_WEIGHT;
    return {
      headers: { priority, weight },
      id: jobId,
      retryOptions: _retryOptions,
    };
  }
  //Execute the promises one by one awaiting for each one
  public async execute(): Promise<void> {
    for (const job of this.queue) {
      await job.data();
      job.done();
    }
  }
  /**
   * Refills the bucket with tokens
   * @returns void
   */
  private readonly refillBucket = (): void => {
    if (this.actualBucketSize < this._options.bucketSize) {
      this.actualBucketSize = Math.min(
        this.actualBucketSize + this._options.tokensPerInterval,
        this._options.bucketSize
      );
    }
  };
}
