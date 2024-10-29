/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash, Multi } from '@mdf.js/crash';
import { TaskHandler } from './TaskHandler';
import { TaskOptions } from './types';

export class Group<T, U> extends TaskHandler<(T | null)[], U> {
  /** Results of the sequence */
  private readonly results: (T | null)[] = [];
  /** Error of the group of tasks */
  private error?: Multi;
  /**
   * Create a new task handler for a group of tasks
   * @param tasks - The tasks to execute
   * @param options - The options for the task
   * @param atLeastOne - If at least one task must succeed to consider the group as successful
   * execution, in other case, all the tasks must succeed
   */
  constructor(
    private readonly tasks: TaskHandler<T, U>[],
    options?: TaskOptions<U>,
    private readonly atLeastOne?: boolean
  ) {
    super(options);
  }
  /** Execute the task */
  protected async _execute(): Promise<(T | null)[]> {
    this.error = undefined;
    for (const task of this.tasks) {
      await this.unitaryExecution(task);
    }
    if ((!this.atLeastOne && this.error) || (this.atLeastOne && this.allTasksWithErrors)) {
      throw this.error;
    } else {
      return this.results;
    }
  }
  /** Check if all the tasks have failed */
  private get allTasksWithErrors(): boolean {
    return (
      typeof this.error !== 'undefined' &&
      Array.isArray(this.error.causes) &&
      this.tasks.length === this.error.causes.length
    );
  }
  /**
   * Execute a task and handle the result
   * @param task - The task to execute
   */
  private async unitaryExecution(task: TaskHandler<T, U>): Promise<void> {
    try {
      const result = await task.execute();
      this.results.push(result);
      this._$meta.push(task.metadata);
    } catch (rawError) {
      const cause = Crash.from(rawError);
      if (!this.error) {
        this.error = new Multi(`At least one of the task grouped failed`, {
          causes: [cause],
        });
        this._reason = this.error.message;
      } else {
        this.error.push(cause);
      }
      this.results.push(null);
      this._$meta.push(task.metadata);
    }
  }
}

