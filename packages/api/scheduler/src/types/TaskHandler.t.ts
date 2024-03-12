/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Jobs } from '@mdf.js/core';
import { RetryOptions, TaskArguments, TaskAsPromise } from '@mdf.js/utils';
import { EventEmitter } from 'events';
import { v4 } from 'uuid';
import { MetaData } from '../commands';
import { TaskOptions } from './JobOptions.i';
import { TASK_STATE, TaskState } from './TaskState.t';
import { DEFAULT_PRIORITY, DEFAULT_RETRY_OPTIONS, DEFAULT_WEIGHT } from './const';

/** Job headers used to pass specific information for jobs handlers */
export type TaskHeaders = {
  /** The priority of the job */
  priority: number;
  /** The weight of the job */
  weight: number;
};

/** Represents the task handler */
export type TaskHandler<T> = Jobs.JobHandler<'task', (() => Promise<T>) | T, TaskHeaders>;
/** Represents the task result */
export type TaskResult = Jobs.Result<'task'>;
/** Represents the task job */
export const TaskHandler = Jobs.JobHandler;

export class TaskHandler2<T> extends EventEmitter {
  /** Unique task identification, unique for each task */
  public readonly uuid: string;
  /** Task identifier, defined by the user */
  public readonly taskId: string;
  /** Date when the task was created */
  public readonly createdAt: Date;
  /** Date when the task was executed in ISO format */
  private executedAt?: string;
  /** Date when the task was completed in ISO format */
  private completedAt?: string;
  /** Date when the task was cancelled in ISO format */
  private cancelledAt?: string;
  /** Date when the task was failed in ISO format  */
  private failedAt?: string;
  /** Reason of failure or cancellation */
  private _reason?: string;
  /** Additional metadata in case the execution required execute other tasks */
  private readonly _$meta: MetaData[] = [];
  /** Task priority */
  public readonly priority: number;
  /** Task weight */
  public readonly weight: number;
  /** Status of the task */
  private _status: TaskState = TASK_STATE.PENDING;
  /** Duration of the task in milliseconds */
  private _duration?: number;
  /** Retry options */
  private retryOptions: RetryOptions;
  /** The task to execute */
  private readonly task: TaskAsPromise<T>;
  /** The arguments for the task */
  private readonly taskArgs: TaskArguments;
  /**
   * Create a new task handler
   * @param task - The task to execute
   * @param taskArgs - The arguments for the task
   * @param options - The options for the task
   */
  constructor(task: TaskAsPromise<T>, options?: TaskOptions);
  /**
   * Create a new task handler
   * @param task - The task to execute
   * @param taskArgs - The arguments for the task
   * @param options - The options for the task
   */
  constructor(task: TaskAsPromise<T>, taskArgs?: TaskArguments, options?: TaskOptions);
  constructor(
    task: TaskAsPromise<T>,
    optionsOrArgs?: TaskArguments | TaskOptions,
    optionsOrUndefined?: TaskOptions
  ) {
    super();
    this.uuid = v4();
    this.createdAt = new Date();
    this.task = task;
    let options;
    if (optionsOrArgs) {
      if (Array.isArray(optionsOrArgs)) {
        this.taskArgs = optionsOrArgs;
      } else {
        const { priority, weight, taskId, retryOptions } = this.getJobOptions(optionsOrUndefined);
      }
    }
    const { priority, weight, taskId, retryOptions } = this.getJobOptions(optionsOrUndefined);
    this.priority = priority;
    this.weight = weight;
    this.taskId = taskId;
    this.retryOptions = retryOptions;
  }
  /**
   * Determines the job options
   * @param options - The options for the job
   * @returns The job options
   */
  private getJobOptions(options: TaskOptions = {}): {
    priority: number;
    weight: number;
    taskId: string;
    retryOptions: RetryOptions;
  } {
    return {
      priority: options.priority ?? DEFAULT_PRIORITY,
      weight: options.weight ?? DEFAULT_WEIGHT,
      taskId: options.id || v4(),
      retryOptions: options.retryOptions || DEFAULT_RETRY_OPTIONS,
    };
  }
}
