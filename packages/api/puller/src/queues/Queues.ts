/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { DLList } from '../dlList';
import { Events } from '../events';
import { Job } from '../job';

/**
 * Represents a collection of job queues with different priorities.
 */
export class Queues {
  /** The events object for triggering queue events */
  private _events: Events;
  /** The total length of all queues combined */
  private _length: number;
  /** The lists of job queues, each corresponding to a different priority */
  private _lists: DLList<Job>[];

  /** On event listener to be handled by events object */
  public on: any;
  /** Once event listener to be handled by events object */
  public once: any;
  /** Remove event listeners functionality to be handled by events object */
  public removeAllListeners: any;

  /**
   * Creates a new instance of the Queues class.
   * @param num_priorities - The number of priorities for the job queues.
   */
  constructor(num_priorities: number) {
    this._events = new Events(this);
    this._length = 0;
    this._lists = [];

    for (let i = 1; i <= num_priorities; i++) {
      this._lists.push(
        new DLList<Job>(
          () => {
            return this.incr();
          },
          () => {
            return this.decr();
          }
        )
      );
    }
  }

  /**
   * Increases the total length of the queues and triggers the 'leftzero' event
   * if the length was zero.
   */
  private incr(): void {
    if (this._length++ === 0) {
      this._events.trigger('leftzero');
    }
  }

  /**
   * Decreases the total length of the queues and triggers the 'zero' event if the
   * length becomes zero.
   */
  private decr(): void {
    if (--this._length === 0) {
      this._events.trigger('zero');
    }
  }

  /**
   * Pushes a job into the appropriate queue based on its priority.
   * @param job - The job to be pushed into the queue.
   */
  public push(job: Job): void {
    return this._lists[job.options.priority].push(job);
  }

  /**
   * Returns the number of jobs in the queues, either for a specific priority or the
   * total length of all queues combined.
   * @param priority - The priority for which to retrieve the number of jobs.
   * @returns The number of jobs in the queues.
   */
  public queued(priority?: number): number {
    if (priority != null) {
      return this._lists[priority].length;
    } else {
      return this._length;
    }
  }

  /**
   * Shifts all jobs from all queues and applies a function to each shifted job.
   * @param fn - The function to be applied to each shifted job.
   */
  public shiftAll(fn: (value: any) => void): void {
    this._lists.forEach(list => {
      list.forEachShift(fn);
    });
  }

  /**
   * Returns the first non-empty job queue, starting from a specific priority or from
   * the beginning by default.
   * @param arr - The array of job queues to search.
   * @returns The first non-empty job queue, or an empty array if all queues are empty.
   */
  public getFirst(arr: DLList<Job>[] = this._lists): DLList<Job> | [] {
    for (const list of arr) {
      if (list.length > 0) {
        return list;
      }
    }
    return [];
  }

  /**
   * Shifts the last job from the queues starting from a specific priority.
   * @param priority - The priority from which to start shifting the job.
   * @returns The shifted job, or null if no job is available.
   */
  public shiftLastFrom(priority: number): Job | null {
    const reversedListsFromPriority = this._lists.slice(priority).reverse();
    const shifted = this.getFirst(reversedListsFromPriority).shift();
    if (shifted) {
      return shifted;
    } else {
      return null;
    }
  }
  /*
   * ---------------------------------------------------------------------------------------------
   * GETTERS
   * ---------------------------------------------------------------------------------------------
   */
  /** Gets the total length of all queues combined */
  public get length(): number {
    return this._length;
  }
  /** Gets the events object for triggering queue events */
  public get events(): Events {
    return this._events;
  }
  /** Gets the lists of job queues, each corresponding to a different priority */
  public get lists(): DLList<Job>[] {
    return this._lists;
  }
}
