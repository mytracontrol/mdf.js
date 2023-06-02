/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { DLList } from './DLList';
import { Events } from './Events';

export class Queues {
  private _events: Events;
  private _length: number;
  private _lists: DLList<any>[];

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

  incr(): void {
    if (this._length++ === 0) {
      this._events.trigger('leftzero');
    }
  }

  decr(): void {
    if (--this._length === 0) {
      this._events.trigger('zero');
    }
  }

  push(job: any): void {
    return this._lists[job.options.priority].push(job);
  }

  queued(priority?: number): number {
    if (priority != null) {
      return this._lists[priority].length;
    } else {
      return this._length;
    }
  }

  shiftAll(fn: (value: any) => void): void {
    return this._lists.forEach(list => {
      return list.forEachShift(fn);
    });
  }

  getFirst(arr: DLList<any>[] = this._lists): DLList<any> | [] {
    for (const list of arr) {
      if (list.length > 0) {
        return list;
      }
    }
    return [];
  }

  shiftLastFrom(priority: number): any {
    const reversedListsFromPriority = this._lists.slice(priority).reverse();
    return this.getFirst(reversedListsFromPriority).shift();
  }
}
