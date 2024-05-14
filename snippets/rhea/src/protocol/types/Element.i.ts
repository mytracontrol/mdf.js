/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { PrimitiveBasedValue, Primitives } from './Primitives.t';

/** The decoded element from a buffer */
export interface Element<T extends Primitives> {
  /** Element primitive */
  primitive: T;
  /** Element size, in bytes */
  size: number;
  /** Element value */
  value: PrimitiveBasedValue<T>;
}
