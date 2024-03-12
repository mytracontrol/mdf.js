/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { RetryOptions } from '@mdf.js/utils';

/** Represents the options for a task */
export interface TaskOptions {
  /**
   * The priority of the task. A higher value means a higher priority. The default priority is 0.
   * @default 0
   */
  priority?: number;
  /**
   * The weight of the task, this define the number of tokens that the task will consume from the
   * bucket. The default weight is 1.
   * @default 1
   */
  weight?: number;
  /**
   * Task identifier, it necessary to identify the task during all the process, for example, when
   * the job is executed, the event with the task identifier will be emitted with the result of the
   * task.
   * @default If not provided, the task identifier will be generated automatically.
   */
  id?: string;
  /**
   * Set the options for the retry process of the task
   * @default undefined
   */
  retryOptions?: RetryOptions;
}
