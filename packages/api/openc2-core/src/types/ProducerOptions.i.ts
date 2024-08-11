/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { ComponentOptions } from './ComponentOptions.i';

export interface ProducerOptions extends ComponentOptions {
  /** Lookup interval in milliseconds */
  lookupInterval?: number;
  /** Lookup timeout in milliseconds */
  lookupTimeout?: number;
  /* Aging interval in milliseconds */
  agingInterval?: number;
  /** Max allowed age in in milliseconds for a table entry */
  maxAge?: number;
}
