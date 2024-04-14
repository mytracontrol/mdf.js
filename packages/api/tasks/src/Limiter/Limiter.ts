/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { TaskArguments, TaskAsPromise } from '@mdf.js/utils';
import { setTimeout as waitFor } from 'timers/promises';
import { MetaData, Single, TaskHandler, TaskOptions } from '../Tasks';
import { LimiterStateHandler } from './LimiterStateHandler';
import { LimiterOptions } from './types';

/**
 * A limiter is a queue system that allows you to control the rate of job processing. It can be used
 * to limit the number of concurrent jobs, the delay between each job, the maximum number of jobs in
 * the queue, and the strategy to use when the queue length reaches highWater.
 */
export class Limiter extends LimiterStateHandler {
  /** The private piped limiter */
  private pipedLimiter?: Limiter;
  /**
   * Create a new instance of Limiter
   * @param options - The limiter options
   */
  constructor(options?: LimiterOptions) {
    super(options);
    this.on('seed', this.onEnqueueEvent.bind(this));
    this.on('refill', this.onEnqueueEvent.bind(this));
  }
  /**
   * Schedules a task to be executed by the limiter
   * @param task - The task to schedule
   * @returns The task handler
   */
  public schedule<T, U>(task: TaskHandler<T, U>): string | undefined;
  /**
   * Schedules a task to be executed by the limiter
   * @param task - The task to schedule
   * @param taskArgs - The arguments for the task
   * @param options - The options for the job
   * @returns The task handler
   */
  public schedule<T, U>(
    task: TaskAsPromise<T>,
    taskArgs?: TaskArguments,
    options?: TaskOptions<U>
  ): string | undefined;
  public schedule<T, U>(
    task: TaskAsPromise<T> | TaskHandler<T, U>,
    taskArgs?: TaskArguments,
    options?: TaskOptions<U>
  ): string | undefined {
    const handler = task instanceof TaskHandler ? task : new Single(task, taskArgs, options);
    if (!this.enqueue(handler)) {
      return undefined;
    }
    const onDone = (uuid: string, result: T, meta: MetaData, error?: Crash) => {
      this.dec();
      this.emit('done', uuid, result, meta, error);
      this.emit(handler.taskId, uuid, result, meta, error);
    };
    handler.once('done', onDone);
    return handler.taskId;
  }
  /**
   * Executes a task and returns a promise that resolves when the task is done
   * @param task - The task to execute
   * @returns A promise that resolves when the task is done
   */
  public async execute<T, U>(task: TaskHandler<T, U>): Promise<T>;
  /**
   * Executes a task and returns a promise that resolves when the task is done
   * @param task - The task to execute
   * @param taskArgs - The arguments for the task
   * @param options - The options for the job
   * @returns A promise that resolves when the task is done
   */
  public async execute<T, U>(
    task: TaskAsPromise<T>,
    taskArgs?: TaskArguments,
    options?: TaskOptions<U>
  ): Promise<T>;
  public async execute<T, U>(
    task: TaskAsPromise<T> | TaskHandler<T, U>,
    taskArgs?: TaskArguments,
    options?: TaskOptions<U>
  ): Promise<T> {
    const handler = task instanceof TaskHandler ? task : new Single(task, taskArgs, options);
    if (!this.enqueue(handler)) {
      throw new Crash('The job could not be scheduled', { name: 'JobSchedulingError' });
    }
    return new Promise((resolve, reject) => {
      const onDone = (uuid: string, result: T, meta: MetaData, error?: Crash) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
        this.dec();
        this.emit('done', uuid, result, meta, error);
        this.emit(handler.taskId, uuid, result, meta, error);
      };
      handler.once('done', onDone);
    });
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
  /** Pipes the limiter to another limiter */
  public pipe(limiter: Limiter): void {
    this.pipedLimiter = limiter;
  }
  /** Starts the limiter */
  public override start(): void {
    super.start();
    this.nextJobExecution.bind(this)();
  }
  /** Stops the limiter */
  public override stop(): void {
    super.stop();
  }
  /** Request to process a new job if the conditions are met */
  private onEnqueueEvent(): void {
    if (this.pending === 0 || this.size > 0) {
      setImmediate(this.nextJobExecution.bind(this));
    }
  }
  /** Executes the next job in the queue */
  private async nextJobExecution(): Promise<void> {
    if (!this.canProcessMore) {
      return;
    }
    const job = this.dequeue();
    if (!job) {
      return;
    }
    this.inc();
    // If the concurrency is the same as the options, we should await the job
    // Otherwise, we should just run the job and continue
    if (this.atCapacity) {
      await this.runTask(job);
    } else {
      this.runTask(job);
    }
    // If there's a delay, we should wait before executing the next job
    if (this.delay > 0) {
      await waitFor(this.delay);
    }
    this.nextJobExecution.bind(this)();
  }
  /**
   * Executes a task avoiding to throw an error if the task fails
   * @param task - The task to execute
   */
  private async runTask<T, U>(task: TaskHandler<T, U>): Promise<void> {
    try {
      if (this.pipedLimiter) {
        await this.pipedLimiter.execute(task);
      } else {
        await task.execute();
      }
    } catch (rawError) {
      // Do nothing
    }
  }
}
