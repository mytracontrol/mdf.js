/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { TaskOptions } from './TaskOptions.t';
import { TimeoutOptions } from './TimeoutOptions.t';

export type QueueAddOptions = {
  /**
   * Priority of operation. Operations with greater priority will be scheduled first.
   * @default 0
   */
  readonly priority?: number;
} & TaskOptions &
  TimeoutOptions;
