/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Primitive, PrimitiveBasedValue } from './Primitive.t';

/** Represents the decoded types */
export interface Decoded<P extends Primitive = any, D extends Primitive | null = null> {
  /** Primitive type */
  type: P;
  /** Element description */
  descriptor: D extends Primitive ? Decoded<D> : null;
  /** Element size, in bytes, including all the type information */
  size: number;
  /** Element data width, in bytes */
  width: number;
  /** Element value */
  value: PrimitiveBasedValue<P>;
}

/** Represents the undecoded types */
export interface Unencoded<P extends Primitive = any, D extends Primitive | null = null> {
  /** Primitive type */
  type: P;
  /** Element description */
  descriptor: D extends Primitive ? Unencoded<D> : null;
  /** Element value */
  value: unknown;
}
