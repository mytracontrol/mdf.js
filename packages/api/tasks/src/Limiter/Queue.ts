/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { EventEmitter } from 'stream';
import { TaskHandler } from '../Tasks';
import { ConsolidatedQueueOptions, STRATEGIES } from './types';

export interface Queue extends EventEmitter {
  /** Emitted when a job is enqueued */
  on(event: 'enqueue', listener: () => void): this;
  /** Emitted when a job is dequeued */
  on(event: 'dequeue', listener: () => void): this;
  /** Emitted when a job is removed */
  on(event: 'removed', listener: () => void): this;
  /** Emitted when the queue is cleared */
  on(event: 'cleared', listener: () => void): this;
  /** Emitted when the queue is blocked */
  on(event: 'blocked', listener: () => void): this;
  /** Emitted when the queue is unblocked */
  on(event: 'unblocked', listener: () => void): this;
  /** Emitted when the queue is empty */
  on(event: 'empty', listener: () => void): this;
  /** Emitted when the bucket is refilled */
  on(event: 'refill', listener: () => void): this;
  /** Emitted when the queue is empty and a job is enqueued */
  on(event: 'seed', listener: () => void): this;
}
/** Represents a queue */
export class Queue extends EventEmitter {
  /** Limiter queue of tasks */
  private queue: TaskHandler[];
  /** The interval timer for the rate limiter */
  private refillTimer: NodeJS.Timeout | undefined = undefined;
  /** The actual bucket size */
  private actualBucketSize;
  /** Whether the queue is blocked */
  private blocked: boolean = false;
  /**
   * Create a new instance of Queue
   * @param options - The queue options
   */
  constructor(private readonly options: ConsolidatedQueueOptions) {
    super();
    this.checkOptions(options);
    this.queue = [];
    this.actualBucketSize = this.options.bucketSize;
    if (this.actualBucketSize > 0) {
      this.refillTimer = setTimeout(this.refillBucket, this.options.interval);
    }
    this.on('dequeue', () => {
      if (this.size === 0) {
        this.emit('empty');
      }
    });
    this.on('enqueue', () => {
      if (this.size === 1) {
        this.emit('seed');
      }
    });
  }
  /**
   * Enqueues a job with optional priority
   * @param job - The job to enqueue
   */
  public enqueue(job: TaskHandler): boolean {
    if (!this.handleQueueStrategy(job)) {
      return false;
    }
    if (this.size && this.queue[this.size - 1].priority >= job.priority) {
      this.queue.push(job);
      this.emit('enqueue');
      return true;
    }
    const index = this.lowerBound(this.queue, job, (a, b) => b.priority - a.priority);
    this.queue.splice(index, 0, job);
    this.emit('enqueue');
    return true;
  }
  /**
   * Dequeues and returns the next job in the queue
   * @returns The next job, or undefined if the queue is empty
   */
  public dequeue(): TaskHandler | undefined {
    if (this.checkAndDecrementBucketSize(this.queue[0].weight)) {
      const entry = this.queue.shift();
      this.emit('dequeue');
      return entry;
    } else {
      return undefined;
    }
  }
  /**
   * Drops the oldest job in the queue with the lowest priority if not priority is provided, and
   * drops the oldest job with a lower priority than the provided priority otherwise
   * @remarks
   * The queue is ordered by priority and age, this means that first jobs have a higher priority,
   * and if several jobs have the same priority, the oldest one its earlier in the queue
   * @param priority - The priority of the job to drop
   * @returns The dropped job, or undefined if the queue is empty
   */
  public dropByPriory(priority?: number): TaskHandler | undefined {
    if (this.size === 0) {
      return undefined;
    }
    let _priority: number;
    if (priority === undefined) {
      // If no priority is provided, drop the oldest job with the lowest priority in the queue
      _priority = this.frontPeek()!.priority;
    } else {
      // If a priority is provided, drop the oldest job with a lower priority than the provided one
      _priority = priority - 1;
    }
    const index = this.queue.findIndex(job => job.priority <= _priority);
    // If no job has a lower priority, no job is dropped
    if (index === -1) {
      return undefined;
    }
    return this.remove(this.queue[index].uuid);
  }
  /**
   * Peeks the next job in the queue
   * @returns The next job, or undefined if the queue is empty
   */
  public frontPeek(): TaskHandler | undefined {
    return this.queue[0];
  }
  /**
   * Removes a job from the queue
   * @param uuid - The uuid of the job to remove
   */
  public remove(uuid: string): TaskHandler | undefined {
    const index = this.queue.findIndex(job => job.uuid === uuid);
    if (index === -1) {
      return undefined;
    }
    const job = this.queue[index];
    this.queue.splice(index, 1);
    this.emit('removed');
    return job;
  }
  /** Clears the queue */
  public clear(): void {
    this.queue = [];
    this.emit('cleared');
    if (this.refillTimer) {
      clearTimeout(this.refillTimer);
      this.refillTimer = undefined;
      this.actualBucketSize = this.options.bucketSize;
    }
  }
  /** Gets the size of the queue */
  public get size(): number {
    return this.queue.length;
  }
  /**
   * Checks the options for the queue and throws an error if they are invalid
   * @param options - The options to check
   */
  private checkOptions(options: ConsolidatedQueueOptions): void {
    const isNotNumberInRange = (value: number, min?: number, max?: number): boolean => {
      return (
        typeof value !== 'number' ||
        Number.isNaN(value) ||
        (min !== undefined && value < min) ||
        (max !== undefined && value > max)
      );
    };
    if (isNotNumberInRange(options.highWater, 1)) {
      throw new Crash('The highWater should be a number greater than 0', {
        name: 'ValidationError',
      });
    }
    if (isNotNumberInRange(options.bucketSize, 0)) {
      throw new Crash('The bucketSize should be a number', { name: 'ValidationError' });
    }
    if (isNotNumberInRange(options.interval, 0) || !Number.isFinite(options.interval)) {
      throw new Crash('The interval should be a number greater than or equal to 0', {
        name: 'ValidationError',
      });
    }
    if (typeof options.strategy !== 'string' || !STRATEGIES.includes(options.strategy)) {
      throw new Crash(`The strategy should be one of ${STRATEGIES.join(', ')}`, {
        name: 'ValidationError',
      });
    }
    if (
      isNotNumberInRange(options.tokensPerInterval, 0) ||
      !Number.isFinite(options.tokensPerInterval)
    ) {
      throw new Crash('The tokensPerInterval should be a number greater than 0', {
        name: 'ValidationError',
      });
    }
    if (isNotNumberInRange(options.penalty, 0) || !Number.isFinite(options.penalty)) {
      throw new Crash('The penalty should be a number', {
        name: 'ValidationError',
      });
    }
    // Check the coherence between the bucket size, the tokens per interval and the interval
    if (options.bucketSize > 0) {
      if (options.tokensPerInterval > options.bucketSize) {
        throw new Crash('The tokensPerInterval should be less than or equal to the bucketSize', {
          name: 'ValidationError',
        });
      }
      if (options.interval <= 0) {
        throw new Crash('The interval should be a number greater than 0', {
          name: 'ValidationError',
        });
      }
      if (options.tokensPerInterval <= 0) {
        throw new Crash('The tokensPerInterval should be a number greater than 0', {
          name: 'ValidationError',
        });
      }
    }
    if (options.strategy === 'block' && options.penalty <= 0) {
      throw new Crash('The penalty should be a number greater than 0', { name: 'ValidationError' });
    }
  }
  /**
   * Returns the index of the lower bound
   * @param array - The array to search
   * @param value - The value to search
   * @param comparator - The comparator function
   * @returns The index of the lower bound
   */
  private lowerBound<T>(array: readonly T[], value: T, comparator: (a: T, b: T) => number): number {
    let first = 0;
    let count = array.length;
    while (count > 0) {
      const step = Math.trunc(count / 2);
      let it = first + step;
      if (comparator(array[it], value) <= 0) {
        first = ++it;
        count -= step + 1;
      } else {
        count = step;
      }
    }
    return first;
  }
  /**
   * Check if there is enough tokens to execute the task and consume the tokens
   * @param weight - task weight
   * @returns boolean
   */
  private checkAndDecrementBucketSize(weight: number): boolean {
    if (this.options.bucketSize <= 0) {
      return true;
    }
    if (this.actualBucketSize < weight) {
      return false;
    }
    this.actualBucketSize -= weight;
    return true;
  }
  /**
   * Applies the strategy to the queue
   * @param job - The job to add
   * @returns True if the job should be added, false otherwise
   */
  private handleQueueStrategy(job: TaskHandler): boolean {
    if (this.blocked) {
      return false;
    }
    if (this.size < this.options.highWater) {
      return true;
    }
    switch (this.options.strategy) {
      // Drop the oldest job with the lowest priority
      case 'leak':
        this.dropByPriory();
        return true;
      // Drop a job that are less important than the one being added
      case 'overflow-priority':
        if (this.dropByPriory(job.priority)) {
          return true;
        }
        return false;
      // Block the queue
      case 'block':
        this.clear();
        this.blocked = true;
        this.emit('blocked');
        setTimeout(() => {
          this.blocked = false;
          this.emit('unblocked');
        }, this.options.penalty || 0);
        return false;
      // Do not add the new job
      case 'overflow':
      default:
        return false;
    }
  }
  /**
   * Refills the bucket with tokens
   * @returns void
   */
  private readonly refillBucket = (): void => {
    if (this.actualBucketSize < this.options.bucketSize) {
      this.actualBucketSize = Math.min(
        this.actualBucketSize + this.options.tokensPerInterval,
        this.options.bucketSize
      );
      this.emit('refill');
    }
    this.refillTimer = setTimeout(this.refillBucket, this.options.interval);
  };
}
