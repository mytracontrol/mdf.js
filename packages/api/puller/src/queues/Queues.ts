/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { DLList } from '../dlList/DLList';
import { Events } from '../events/Events';
import { Job } from '../job/Job';

export class Queues {
  private _events: Events;
  private _length: number;
  private _lists: DLList<Job>[];

  public on: any;
  public once: any;
  public removeAllListeners: any;

  constructor(num_priorities: number) {
    this._events = new Events(this);
    this._length = 0;
    this._lists = [];

    for (let i = 1; i <= num_priorities; i++) {
      this._lists.push(
        new DLList(
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

  private incr(): void {
    if (this._length++ === 0) {
      this._events.trigger('leftzero');
    }
  }

  private decr(): void {
    if (--this._length === 0) {
      this._events.trigger('zero');
    }
  }

  public push(job: Job): void {
    return this._lists[job.options.priority].push(job);
  }

  public queued(priority?: number): number {
    if (priority != null) {
      return this._lists[priority].length;
    } else {
      return this._length;
    }
  }

  public shiftAll(fn: (value: any) => void): void {
    this._lists.forEach(list => {
      list.forEachShift(fn);
    });
  }

  public getFirst(arr: DLList<Job>[] = this._lists): DLList<Job> | [] {
    for (const list of arr) {
      if (list.length > 0) {
        return list;
      }
    }
    return [];
  }

  public shiftLastFrom(priority: number): Job | null | undefined {
    const reversedListsFromPriority = this._lists.slice(priority).reverse();
    return this.getFirst(reversedListsFromPriority).shift();
  }

  // ------------------ GETTERS ------------------

  public get length(): number {
    return this._length;
  }

  public get events(): Events {
    return this._events;
  }

  public get lists(): DLList<Job>[] {
    return this._lists;
  }
}
