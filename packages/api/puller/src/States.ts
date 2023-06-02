/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { BottleneckError } from './BottleneckError';

export class States {
  private status: string[];
  private _jobs: Record<string, number>;
  private counts: number[];

  constructor(status1: string[]) {
    this.status = status1;
    this._jobs = {};
    this.counts = this.status.map(() => 0);
  }

  next(id: string): void {
    const current = this._jobs[id];
    if (current != undefined) {
      const next = current + 1;
      if (next < this.status.length) {
        this.counts[current]--;
        this.counts[next]++;
        this._jobs[id]++;
      } else {
        // Last state - DONE
        this.counts[current]--;
        delete this._jobs[id];
      }
    }
  }

  start(id: string): void {
    const initial = 0;
    this._jobs[id] = initial;
    this.counts[initial]++;
  }

  remove(id: string): boolean {
    const current = this._jobs[id];
    if (current != undefined) {
      this.counts[current]--;
      delete this._jobs[id];
      return true;
    } else {
      return false;
    }
  }

  jobStatus(id: string): string | null {
    return this.status[this._jobs[id]] ?? null;
  }

  statusJobs(status?: string): string[] {
    if (status != undefined) {
      const pos = this.status.indexOf(status);
      if (pos < 0) {
        throw new BottleneckError(`status must be one of ${this.status.join(', ')}`);
      }
      const results: string[] = [];
      for (const [k, v] of Object.entries(this._jobs)) {
        if (v === pos) {
          results.push(k);
        }
      }
      return results;
    } else {
      return Object.keys(this._jobs);
    }
  }

  statusCounts(): Record<string, number> {
    return this.counts.reduce((acc: Record<string, number>, v: number, i: number) => {
      acc[this.status[i]] = v;
      return acc;
    }, {});
  }
}
