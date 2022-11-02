/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { BaseOptions } from './BaseOptions.i';
import { Cause } from './Cause.t';

/**
 * Crash error configuration options
 * @category Crash
 * @public
 */
export interface CrashOptions extends BaseOptions {
  /** Error that caused the creation of this instance */
  cause?: Cause;
}
