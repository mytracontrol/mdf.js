/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import type { BaseOptions } from '.';
import { Crash } from '../Crash';

/**
 * Multi error configuration options
 * @category Multi
 * @public
 */
export interface MultiOptions extends BaseOptions {
  /** Errors that caused the creation of this instance */
  causes?: Array<Error | Crash> | Error | Crash;
}
