/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { MetaData } from './MetaData.i';

/**
 * Event handler for the `done` event, emitted when a task has ended, either due to completion or
 * failure.
 * @category @mdf.js/tasks
 * @typeParam Result - The type of the result of the task
 * @param uuid - The unique identifier of the task
 * @param result - The result of the task
 * @param meta - The {@link MetaData} information of the task, including all the relevant information
 * @param error - The error of the task, if any
 */
export type DoneEventHandler<Result = any> = (
  uuid: string,
  result: Result,
  meta: MetaData,
  error?: Crash
) => void;
