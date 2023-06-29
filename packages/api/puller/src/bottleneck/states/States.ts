/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { BottleneckError } from '../bottleneckError';

/**
 * Represents a state management utility.
 */
export class States {
  /** The list of available status values */
  private _status: string[];
  /** he mapping of job IDs to their current state index */
  private _jobs: Record<string, number>;
  /** The counts of jobs for each status */
  private _counts: number[];

  /**
   * Creates a new instance of the States class.
   * @param status - The list of available status values.
   */
  constructor(status: string[]) {
    this._status = status;
    this._jobs = {};
    this._counts = this._status.map(() => 0);
  }

  /**
   * Moves the state of a job to the next status.
   * @param id - The ID of the job.
   */
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

  /**
   * Sets the initial state of a job.
   * @param id - The ID of the job.
   */
  start(id: string): void {
    const initial = 0;
    this._jobs[id] = initial;
    this._counts[initial]++;
  }

  /**
   * Removes a job and its associated state.
   * @param id - The ID of the job.
   * @returns True if the job was removed successfully, false otherwise.
   */
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

  /**
   * Retrieves the status of a job.
   * @param id - The ID of the job.
   * @returns The status of the job, or null if the job doesn't exist.
   */
  jobStatus(id: string): string | null {
    return this._status[this._jobs[id]] ?? null;
  }

  /**
   * Retrieves the list of jobs with a specific status.
   * @param status - The status to filter the jobs by.
   * @returns The list of job IDs with the specified status.
   * @throws {@link BottleneckError} if the provided status is not valid.
   */
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

  /**
   * Retrieves the counts of jobs for each status.
   * @returns An object containing the counts of jobs for each status.
   */
  statusCounts(): Record<string, number> {
    return this._counts.reduce((acc: Record<string, number>, v: number, i: number) => {
      acc[this._status[i]] = v;
      return acc;
    }, {});
  }

  /*
   * ---------------------------------------------------------------------------------------------
   * GETTERS
   * ---------------------------------------------------------------------------------------------
   */
  /** The counts of jobs for each status */
  public get counts(): number[] {
    return this._counts;
  }
}
