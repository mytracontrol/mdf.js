/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { lowerBound } from '.';
import { PriorityQueueOptions, Queue, RunFunction } from '../types';

/** Represents a priority queue */
export class PriorityQueue implements Queue<RunFunction, PriorityQueueOptions> {
  /** The queue of run functions with optional priority. */
  private readonly queue: Array<PriorityQueueOptions & { run: RunFunction }> = [];
  /**
   * Enqueues a run function with optional priority.
   * @param run - The run function to enqueue.
   * @param options - The optional priority queue options.
   */
  public enqueue(run: RunFunction, options?: Partial<PriorityQueueOptions>): void {
    options = {
      priority: 0,
      ...options,
    };
    const element = {
      priority: options['priority'],
      run,
    };
    if (this.size && this.queue[this.size - 1]!.priority! >= options['priority']!) {
      this.queue.push(element);
      return;
    }
    const index = lowerBound(
      this.queue,
      element,
      (a: Readonly<PriorityQueueOptions>, b: Readonly<PriorityQueueOptions>) =>
        b['priority']! - a['priority']!
    );
    this.queue.splice(index, 0, element);
  }
  /**
   * Dequeues and returns the next run function in the queue.
   * @returns The next run function, or undefined if the queue is empty.
   */
  public dequeue(): RunFunction | undefined {
    const item = this.queue.shift();
    return item?.run;
  }
  /**
   * Filters the queue and returns an array of run functions with the specified priority.
   * @param options - The priority queue options to filter by.
   * @returns An array of run functions with the specified priority.
   */
  public filter(options: Readonly<Partial<PriorityQueueOptions>>): RunFunction[] {
    return this.queue
      .filter(
        (element: Readonly<PriorityQueueOptions>) => element['priority'] === options['priority']
      )
      .map((element: Readonly<{ run: RunFunction }>) => element.run);
  }
  /** Gets the size of the queue */
  get size(): number {
    return this.queue.length;
  }
}
