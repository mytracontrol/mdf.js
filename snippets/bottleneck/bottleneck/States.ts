/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Crash } from '@mdf.js/crash';
import { DEFAULT_STATES_NAMES, JOB_STATUS, JobState } from './types';

/** Initial state index */
const INITIAL_STATE_INDEX = 0;

/** Represents a state management utility */
export class States {
  /** The mapping of job identifiers to their current state index */
  private _jobs: Map<string, number> = new Map();
  /** The list of available status values */
  private readonly statesArray: JobState[];
  /** The counts of jobs for each status */
  private readonly overallJobStatuses: number[];
  /**
   * Creates a new instance of the States class.
   * @param trackDoneStatus - Whether to track the DONE status.
   */
  constructor(trackDoneStatus: boolean) {
    this.statesArray = trackDoneStatus
      ? [...DEFAULT_STATES_NAMES, JOB_STATUS.DONE]
      : DEFAULT_STATES_NAMES;
    this.overallJobStatuses = Array(this.statesArray.length).fill(0);
  }
  /**
   * Moves the state of a job to the next status.
   * @param id - Job identifier.
   */
  public next(id: string): void {
    const stateIndex = this._jobs.get(id);
    if (stateIndex != undefined) {
      const nextStateIndex = stateIndex + 1;
      if (nextStateIndex < this.statesArray.length) {
        this.overallJobStatuses[stateIndex]--;
        this.overallJobStatuses[nextStateIndex]++;
        this._jobs.set(id, stateIndex + 1);
      } else {
        // Last state - DONE
        this.overallJobStatuses[stateIndex]--;
        this._jobs.delete(id);
      }
    } else {
      throw new Crash(`Job ${id} does not exist`);
    }
  }
  /**
   * Sets the initial state of a job.
   * @param id - Job identifier.
   */
  public start(id: string): void {
    this._jobs.set(id, INITIAL_STATE_INDEX);
    this.overallJobStatuses[INITIAL_STATE_INDEX]++;
  }
  /**
   * Removes a job and its associated state.
   * @param id - Job identifier.
   * @returns True if the job was removed successfully, false otherwise.
   */
  public remove(id: string): boolean {
    const stateIndex = this._jobs.get(id);
    if (stateIndex != undefined) {
      this.overallJobStatuses[stateIndex]--;
    }
    return this._jobs.delete(id);
  }
  /**
   * Retrieves the status of a job.
   * @param id - Job identifier.
   * @returns The status of the job, or null if the job doesn't exist.
   */
  public jobStatus(id: string): JobState | null {
    const stateIndex = this._jobs.get(id);
    if (stateIndex != undefined) {
      return this.statesArray[stateIndex];
    } else {
      return null;
    }
  }
  /**
   * Retrieves the jobs with the specified status.
   * If no status is provided, returns all jobs.
   * @param status - The status of the jobs to retrieve.
   * @returns An array of job identifiers with the specified status, or all job IDs if no status is
   * provided.
   * @throws If the provided status is not one of the valid states.
   */
  public statusJobs(status?: JobState): string[] {
    if (status != undefined) {
      const statusIndex = this.statesArray.indexOf(status);
      if (statusIndex < 0) {
        throw new Crash(`Status must be one of ${this.statesArray.join(', ')}`);
      }
      const results: string[] = [];
      for (const [id, jobStatusIndex] of this._jobs.entries()) {
        if (jobStatusIndex === statusIndex) {
          results.push(id);
        }
      }
      return results;
    } else {
      return Array.from(this._jobs.keys());
    }
  }
  /**
   * Retrieves the counts of jobs for each status.
   * @returns An object containing the counts of jobs for each status.
   */
  public statusCounts(): Record<JobState, number> {
    return this.overallJobStatuses.reduce(
      (accumulatedObject: Record<string, number>, currentValue: number, index: number) => {
        accumulatedObject[this.statesArray[index]] = currentValue;
        return accumulatedObject;
      },
      {}
    );
  }
  /** The counts of jobs for each status */
  public get counts(): number[] {
    return this.overallJobStatuses;
  }
}
