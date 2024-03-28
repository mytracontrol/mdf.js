/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { TaskArguments, TaskAsPromise } from '@mdf.js/utils';
import { TaskOptions } from '../../Tasks';

/** Extends the task options with the task identifier, making it mandatory */
export interface WellIdentifiedTaskOptions<Binding = any> extends TaskOptions<Binding> {
  /**
   * Task identifier, it necessary to identify the task during all the process, for example, when
   * the job is executed, the event with the task identifier will be emitted with the result of the
   * task. */
  id: string;
}
/** Represents the base configuration for a single task */
export interface SingleTaskBaseConfig<Result = any, Binding = any> {
  /** Task */
  task: TaskAsPromise<Result>;
  /** Task arguments */
  taskArgs?: TaskArguments;
  /** Task options */
  options: WellIdentifiedTaskOptions<Binding>;
}
/** Represents the base configuration for a group of tasks */
export interface GroupTaskBaseConfig<Result = any, Binding = any> {
  /** Tasks */
  tasks: SingleTaskBaseConfig<Result, Binding>[];
  /** Group of tasks options */
  options: WellIdentifiedTaskOptions;
}
/** Represents the base configuration for a sequence of tasks */
export interface SequenceTaskBaseConfig<Result = any, Binding = any> {
  /** Task pattern */
  pattern: {
    pre?: SingleTaskBaseConfig<Result, Binding>[];
    task: SingleTaskBaseConfig<Result, Binding>;
    post?: SingleTaskBaseConfig<Result, Binding>[];
    finally?: SingleTaskBaseConfig<Result, Binding>[];
  };
  /** The schedule of the task */
  options: WellIdentifiedTaskOptions;
}
/** Represents the base configuration for a task */
export type TaskBaseConfig<Result = any, Binding = any> =
  | SingleTaskBaseConfig<Result, Binding>
  | GroupTaskBaseConfig<Result, Binding>
  | SequenceTaskBaseConfig<Result, Binding>;
