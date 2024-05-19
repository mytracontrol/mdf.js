/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/**
 * The subcategories of the AMQP encoding categories.
 */
export enum Subcategory {
  /** Fixed width with zero octets of data */
  DESCRIPTOR = 0x00,
  /** Fixed width with zero octets of data */
  EMPTY = 0x04,
  /** Fixed width with one octet of data */
  FIXED_ONE = 0x05,
  /** Fixed width with two octets of data */
  FIXED_TWO = 0x06,
  /** Fixed width with four octets of data */
  FIXED_FOUR = 0x07,
  /** Fixed width with eight octets of data */
  FIXED_EIGHT = 0x08,
  /** Fixed width with sixteen octets of data */
  FIXED_SIXTEEN = 0x09,
  /** One octet of size, 0-255 octets of data */
  VARIABLE_ONE = 0x0a,
  /** Four octets of size, 0-4294967295 octets of data */
  VARIABLE_FOUR = 0x0b,
  /** One octet each of size and count, 0-255 distinctly typed values */
  COMPOUND_ONE = 0x0c,
  /** Four octets each of size and count, 0-4294967295 distinctly typed values */
  COMPOUND_FOUR = 0x0d,
  /** One octet each of size and count, 0-255 uniformly typed values */
  ARRAY_ONE = 0x0e,
  /** Four octets each of size and count, 0-4294967295 uniformly typed values */
  ARRAY_FOUR = 0x0f,
}
