/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { TaskHandler } from './types';

/** Represents a queue */
export class Queue {
  /** Limiter queue of tasks */
  private queue: TaskHandler<any>[] = [];
  /**
   * Enqueues a job with optional priority
   * @param job - The job to enqueue
   */
  public enqueue<T>(job: TaskHandler<T>): void {
    if (this.size && this.getJobPriority(this.queue[this.size - 1]) >= this.getJobPriority(job)) {
      this.queue.push(job);
      return;
    }
    const index = this.lowerBound(
      this.queue,
      job,
      (a, b) => this.getJobPriority(b) - this.getJobPriority(a)
    );
    this.queue.splice(index, 0, job);
  }
  /**
   * Dequeues and returns the next job in the queue
   * @returns The next job, or undefined if the queue is empty
   */
  public dequeue<T>(): TaskHandler<T> | undefined {
    return this.queue.shift();
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
      if (comparator(array[it]!, value) <= 0) {
        first = ++it;
        count -= step + 1;
      } else {
        count = step;
      }
    }
    return first;
  }
  /**
   * Returns the priority of the job
   * @param job - The job to get the priority
   * @returns The priority of the job
   */
  private getJobPriority<T>(job: TaskHandler<T>): number {
    return job.options?.headers?.priority || 0;
  }
  /** Gets the size of the queue */
  public get size(): number {
    return this.queue.length;
  }
  /** Gets the weight of the queue */
  public get weight(): number {
    return this.queue.reduce((acc, job) => acc + (job.options?.headers?.weight || 0), 0);
  }
}
