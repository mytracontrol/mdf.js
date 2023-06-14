/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { BottleneckError } from '../BottleneckError';

export class States {
  private _status: string[];
  private _jobs: Record<string, number>;
  private _counts: number[];

  constructor(status: string[]) {
    this._status = status;
    this._jobs = {};
    this._counts = this._status.map(() => 0);
  }

  next(id: string): void {
    const current = this._jobs[id];
    if (current != undefined) {
      const next = current + 1;
      if (next < this._status.length) {
        this._counts[current]--;
        this._counts[next]++;
        this._jobs[id]++;
      } else {
        // Last state - DONE
        this._counts[current]--;
        delete this._jobs[id];
      }
    }
  }

  start(id: string): void {
    const initial = 0;
    this._jobs[id] = initial;
    this._counts[initial]++;
  }

  remove(id: string): boolean {
    const current = this._jobs[id];
    if (current != undefined) {
      this._counts[current]--;
      delete this._jobs[id];
      return true;
    } else {
      return false;
    }
  }

  jobStatus(id: string): string | null {
    return this._status[this._jobs[id]] ?? null;
  }

  statusJobs(status?: string): string[] {
    if (status != undefined) {
      const pos = this._status.indexOf(status);
      if (pos < 0) {
        throw new BottleneckError(`status must be one of ${this._status.join(', ')}`);
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
    return this._counts.reduce((acc: Record<string, number>, v: number, i: number) => {
      acc[this._status[i]] = v;
      return acc;
    }, {});
  }

  // ------------- Getters -------------
  public get counts(): number[] {
    return this._counts;
  }
}
