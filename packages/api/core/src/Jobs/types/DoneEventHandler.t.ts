/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Multi } from '@mdf.js/crash';
import { Result } from './Result.i';

/**
 * Event handler for the `done` event, emitted when a job has ended, either due to completion or
 * failure.
 * @category @mdf.js/core
 * @typeParam Type - The type of the job
 * @param uuid - The unique identifier of the job
 * @param result - The result of the job
 * @param error - The error of the job, if any
 */
export type DoneEventHandler<Type extends string> = (
  uuid: string,
  result: Result<Type>,
  error?: Multi
) => void;
