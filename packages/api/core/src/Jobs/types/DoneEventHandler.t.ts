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
 */
export type DoneEventHandler<Type extends string> = (
  uuid: string,
  result: Result<Type>,
  error?: Multi
) => void;
