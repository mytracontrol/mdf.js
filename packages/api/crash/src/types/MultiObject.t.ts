/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { BaseObject } from './BaseObject.i';

/**
 * Multi error object output
 * @category Multi
 * @public
 */
export interface MultiObject extends BaseObject {
  /** Stack of error messages arranged according to the hierarchy of errors and causes */
  trace: string[];
}
