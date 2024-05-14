/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/**
 * The category of a data type determines how the size of the data is determined.
 */
export enum Category {
  /**
   * The size of fixed-width data is determined based solely on the subcategory of the format code
   * for the fixed width value.
   */
  CONSTRUCTOR = 0,
  /**
   * The size of fixed-width data is determined based solely on the subcategory of the format code
   * for the fixed width value.
   */
  FIXED_WIDTH = 1,
  /**
   * The size of variable-width data is determined based on an encoded size that prefixes the data.
   * The width of the encoded size is determined by the subcategory of the format code for the
   * variable width value
   */
  VARIABLE_WIDTH = 2,
  /**
   * Compound data is encoded as a size and a count followed by a polymorphic sequence of count
   * constituent values. Each constituent value is preceded by a constructor that indicates the
   * semantics and encoding of the data that follows. The width of the size and count is determined
   * by the subcategory of the format code for the compound value
   */
  COMPOUND = 3,
  /**
   * Array data is encoded as a size and count followed by an array element constructor followed by
   * a monomorphic sequence of values encoded according to the supplied array element constructor.
   * The width of the size and count is determined by the subcategory of the format code for the
   * array.
   */
  ARRAY = 4,
}
