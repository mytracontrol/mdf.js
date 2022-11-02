/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '../Crash';
import { Multi } from '../Multi';
/**
 * Error cause
 * @public
 */
export type Cause = Error | Crash | Multi;
