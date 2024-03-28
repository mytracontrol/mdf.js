/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { TaskArguments, TaskAsPromise, retry, retryBind } from '@mdf.js/utils';
import { TaskHandler } from './TaskHandler';
import { TaskOptions } from './types';

export class Single<T, U> extends TaskHandler<T, U> {
  /** The task to execute */
  private readonly task: TaskAsPromise<T>;
  /** The arguments for the task */
  private readonly taskArgs: TaskArguments;
  /**
   * Create a new task handler
   * @param task - The task to execute
   * @param options - The options for the task
   */
  constructor(task: TaskAsPromise<T>, options?: TaskOptions<U>);
  /**
   * Create a new task handler
   * @param task - The task to execute
   * @param taskArgs - The arguments for the task
   * @param options - The options for the task
   */
  constructor(task: TaskAsPromise<T>, taskArgs?: TaskArguments, options?: TaskOptions<U>);
  constructor(
    task: TaskAsPromise<T>,
    optionsOrArgs: TaskArguments | TaskOptions<U> = [],
    optionsOrUndefined: TaskOptions<U> = {}
  ) {
    super(Array.isArray(optionsOrArgs) ? optionsOrUndefined : optionsOrArgs);
    this.task = task;
    this.taskArgs = Array.isArray(optionsOrArgs) ? optionsOrArgs : [];
  }
  /** Execute the task */
  protected async _execute(): Promise<T> {
    return this.context
      ? retryBind(this.task, this.context, this.taskArgs, this.retryOptions)
      : retry(this.task, this.taskArgs, this.retryOptions);
  }
}
