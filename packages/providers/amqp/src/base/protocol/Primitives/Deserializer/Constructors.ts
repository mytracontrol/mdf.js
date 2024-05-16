/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Crash } from '@mdf.js/crash';
import { Types } from '../..';
import { Parser } from './Parser';

/** Size of a primitive field in bytes */
const PRIMITIVE_SIZE = 1;
/** Offset of the subcategory in a primitive field in bits */
const SUBCATEGORY_OFFSET = 4;

export class Constructors {
  /**
   * Deserializes a buffer into a fixed width
   * The width of a specific fixed width encoding can be computed from the subcategory of the format
   * code for the fixed width value:
   * ```plaintext
   *     n OCTETs
   *   +----------+
   *   |   data   |
   *   +----------+
   *
   * Subcategory     n
   * =================
   * 0x4             0
   * 0x5             1
   * 0x6             2
   * 0x7             4
   * 0x8             8
   * 0x9             16
   * ```
   * @param buffer - buffer to be deserialized
   * @param primitive - primitive to be deserialized
   * @returns fixed width value
   */
  public static fixedWidth(
    buffer: Buffer,
    primitive: Types.FixedWidth
  ): Types.Decoded<Types.FixedWidth> {
    const subcategory = Constructors.getSubcategory(primitive);
    if (subcategory > Types.Subcategory.FIXED_SIXTEEN || subcategory < Types.Subcategory.EMPTY) {
      throw new Crash(
        `Invalid primitive, expected a fixed width but got ${Types.Subcategory[subcategory]}/[${subcategory.toString(16)}]`,
        { name: 'ProtocolError' }
      );
    }
    const subcategoryWidth = Constructors.getSubcategoryWidth(subcategory);
    const width = Constructors.getDataWidth(buffer, subcategory);
    const size = subcategoryWidth + width + PRIMITIVE_SIZE;
    const value = Parser.parse(buffer.subarray(subcategoryWidth + PRIMITIVE_SIZE, size), primitive);
    return {
      type: primitive,
      descriptor: null,
      size,
      width,
      value,
    } as Types.Decoded<Types.FixedWidth>;
  }
  /**
   * Deserializes a buffer into a variable width
   * All variable width encodings consist of a size in octets followed by size octets of encoded
   * data. The width of the size for a specific variable width encoding can be computed from the
   * subcategory of the format code:
   * ```plaintext
   *   n OCTETs   size OCTETs
   * +----------+-------------+
   * |   size   |    value    |
   * +----------+-------------+
   *
   *     Subcategory     n
   *     =================
   *     0xA             1
   *     0xB             4
   * ```
   * @param buffer - buffer to be deserialized
   * @param primitive - primitive to be deserialized
   * @returns variable width value
   */
  public static variableWidth(
    buffer: Buffer,
    primitive: Types.VariableWidth
  ): Types.Decoded<Types.VariableWidth> {
    const subcategory = Constructors.getSubcategory(primitive);
    if (
      subcategory !== Types.Subcategory.VARIABLE_ONE &&
      subcategory !== Types.Subcategory.VARIABLE_FOUR
    ) {
      throw new Crash(
        `Invalid primitive, expected VARIABLE_ONE or VARIABLE_FOUR but got ${Types.Subcategory[subcategory]}/[${subcategory.toString(16)}]`,
        { name: 'ProtocolError' }
      );
    }
    const subcategoryWidth = Constructors.getSubcategoryWidth(subcategory);
    const width = Constructors.getDataWidth(buffer, subcategory);
    const size = subcategoryWidth + width + PRIMITIVE_SIZE;
    const value = Parser.parse(buffer.subarray(subcategoryWidth + PRIMITIVE_SIZE, size), primitive);
    return {
      type: primitive,
      descriptor: null,
      size,
      width,
      value,
    } as Types.Decoded<Types.VariableWidth>;
  }
  /**
   * Deserializes a buffer into a list
   * ```plaintext
   *                        +----------= count items =----------+
   *                        |                                   |
   *    n OCTETs   n OCTETs |                                   |
   *  +----------+----------+--------------+------------+-------+
   *  |   size   |  count   |      ...    /|    item    |\ ...  |
   *  +----------+----------+------------/ +------------+ \-----+
   *                                    / /              \ \
   *                                   / /                \ \
   *                                  / /                  \ \
   *                                 +-------------+----------+
   *                                 | constructor |   data   |
   *                                 +-------------+----------+
   *
   *               Types.Subcategory     n
   *               =================
   *               0xC             1
   *               0xD             4
   * ```
   * @example
   * ```plaintext
   * [0xC0, // LIST8
   *   0x15, // 21 bytes
   *   0x01, // 1 elements
   *      0xE0, // ARRAY8
   *        0x12, // 18 bytes
   *        0x02, // 2 elements
   *          0xA3, // SYM8
   *            0x05, 0x50, 0x4C, 0x41, 0x49, 0x4E, // "PLAIN"
   *            0x09, 0x41, 0x4E, 0x4F, 0x4E, 0x59, 0x4D, 0x4F, 0x55, 0x53 // "ANONYMOUS"
   * ]
   * ```
   * @param buffer - buffer to be deserialized
   * @param width - width of the list
   * @returns list of 32-bit values
   */
  public static compound(buffer: Buffer, primitive: Types.Compound): Types.Decoded<Types.Compound> {
    const subcategory: Types.Subcategory = primitive >> 4;
    if (
      subcategory !== Types.Subcategory.COMPOUND_ONE &&
      subcategory !== Types.Subcategory.COMPOUND_FOUR
    ) {
      throw new Crash(
        `Invalid primitive, expected COMPOUND_ONE or COMPOUND_FOUR but got ${Types.Subcategory[subcategory]}/[${subcategory.toString(16)}]`,
        { name: 'ProtocolError' }
      );
    }
    const subcategoryWidth = Constructors.getSubcategoryWidth(subcategory) * 2;
    const width = Constructors.getDataWidth(buffer, subcategory);
    const size = subcategoryWidth + width + PRIMITIVE_SIZE;
    const count = Constructors.getCount(buffer, subcategory);

    const elements: Types.Decoded<any>[] = [];
    let offset = subcategoryWidth + PRIMITIVE_SIZE;
    for (let index = 0; index < count; index++) {
      const element = Deserializer.decode(buffer.subarray(offset));
      elements.push(element);
      offset += element.size;
    }
    return {
      type: primitive,
      descriptor: null,
      width,
      size,
      value: elements,
    } as Types.Decoded<Types.Compound>;
  }
  /**
   * Deserializes a buffer into an array
   * All array encodings consist of a size followed by a count followed by an element constructor
   * followed by <i>count</i> elements of encoded data formatted as required by the element
   * constructor:
   * ```plaintext
   *                                                +--= count elements =--+
   *                                                |                      |
   *      n OCTETs   n OCTETs                       |                      |
   *    +----------+----------+---------------------+-------+------+-------+
   *    |   size   |  count   | element-constructor |  ...  | data |  ...  |
   *    +----------+----------+---------------------+-------+------+-------+
   *
   *                           Types.Subcategory     n
   *                           =================
   *                           0xE             1
   *                           0xF             4
   * ```
   * @example
   * ```plaintext
   * [0xE0, // ARRAY8
   *    0x12, // 18 bytes
   *    0x02, // 2 elements
   *      0xA3, // SYM8
   *        0x05, 0x50, 0x4C, 0x41, 0x49, 0x4E, // "PLAIN"
   *        0x09, 0x41, 0x4E, 0x4F, 0x4E, 0x59, 0x4D, 0x4F, 0x55, 0x53 // "ANONYMOUS"
   * ]
   * ```
   * @param buffer - buffer to be deserialized
   * @param primitive - primitive to be deserialized
   * @returns array of 32-bit values
   */
  public static array(buffer: Buffer, primitive: Types.Array): Types.Decoded<Types.Array> {
    const subcategory: Types.Subcategory = primitive >> 4;
    if (
      subcategory !== Types.Subcategory.ARRAY_ONE &&
      subcategory !== Types.Subcategory.ARRAY_FOUR
    ) {
      throw new Crash(
        `Invalid primitive, expected ARRAY_ONE or ARRAY_FOUR but got ${Types.Subcategory[subcategory]}/[${subcategory.toString(16)}]`,
        { name: 'ProtocolError' }
      );
    }
    const subcategoryWidth = Constructors.getSubcategoryWidth(subcategory) * 2;
    const width = Constructors.getDataWidth(buffer, subcategory);
    const size = subcategoryWidth + width + PRIMITIVE_SIZE;
    const count = Constructors.getCount(buffer, subcategory);

    const elements: Types.Decoded<any>[] = [];
    let offset = subcategoryWidth + PRIMITIVE_SIZE;
    let primitive: Types.Primitive;
    for (let i = 0; i < count; i++) {
      const element = Parser.parse(buffer.subarray(offset), primitive);
      elements.push(element);
      offset += element.size;
    }
    return {
      type: primitive,
      size,
      value: elements,
    };
  }
  /**
   * Gets the subcategory of a primitive
   * @param primitive - primitive to be deserialized
   * @returns subcategory of the primitive
   */
  public static getSubcategory(primitive: Types.Primitive): Types.Subcategory {
    return primitive >> SUBCATEGORY_OFFSET;
  }
  /**
   * Gets the width of a subcategory
   * @param subcategory - subcategory of the primitive
   * @returns width of the subcategory
   */
  public static getSubcategoryWidth(subcategory: Types.Subcategory): number {
    if (subcategory <= Types.Subcategory.FIXED_SIXTEEN) {
      return 0;
    } else if (
      subcategory === Types.Subcategory.VARIABLE_FOUR ||
      subcategory === Types.Subcategory.ARRAY_FOUR
    ) {
      return 4;
    } else {
      return 1;
    }
  }
  /**
   * Returns the number of elements in a primitive
   * @param buffer - buffer to be deserialized
   * @param subcategory - subcategory of the primitive
   * @returns number of elements in the primitive
   */
  private static getCount(buffer: Buffer, subcategory: Types.Subcategory): number {
    if (subcategory <= Types.Subcategory.FIXED_SIXTEEN) {
      return 1;
    } else if (
      subcategory === Types.Subcategory.VARIABLE_FOUR ||
      subcategory === Types.Subcategory.ARRAY_FOUR
    ) {
      return buffer.readUInt32BE(5);
    } else {
      return buffer.readUInt8(2);
    }
  }
  /**
   * Gets the size of data in a primitive based on its subcategory
   * @param buffer - buffer to be deserialized
   * @param subcategory - subcategory of the primitive
   * @returns size of data in the primitive
   * @throws {Crash} when the subcategory is not a fixed or variable width
   */
  private static getDataWidth(buffer: Buffer, subcategory: Types.Subcategory): number {
    return subcategory <= Types.Subcategory.FIXED_SIXTEEN
      ? Constructors.getFixedDataWidth(subcategory)
      : Constructors.getVariableDataWidth(buffer, subcategory);
  }
  /**
   * Gets the size of data in a fixed width primitive based on its subcategory
   * @param subcategory - subcategory of the primitive
   * @returns size of data in the primitive
   * @throws {Crash} when the subcategory is not a fixed width
   */
  private static getFixedDataWidth(subcategory: Types.Subcategory): number {
    switch (subcategory) {
      case Types.Subcategory.EMPTY:
        return 0;
      case Types.Subcategory.FIXED_ONE:
        return 1;
      case Types.Subcategory.FIXED_TWO:
        return 2;
      case Types.Subcategory.FIXED_FOUR:
        return 4;
      case Types.Subcategory.FIXED_EIGHT:
        return 8;
      case Types.Subcategory.FIXED_SIXTEEN:
        return 16;
      default:
        throw new Crash(`Category detected as fixed width but no size was found`, {
          name: 'ProtocolError',
        });
    }
  }
  /**
   * Gets the size of data in a variable width primitive based on its subcategory
   * @param buffer - buffer to be deserialized
   * @param subcategory - subcategory of the primitive
   * @returns size of data in the primitive
   * @throws {Crash} when the subcategory is not a variable width
   */
  private static getVariableDataWidth(buffer: Buffer, subcategory: Types.Subcategory): number {
    switch (subcategory) {
      case Types.Subcategory.VARIABLE_ONE:
      case Types.Subcategory.ARRAY_ONE:
      case Types.Subcategory.COMPOUND_ONE:
        return buffer.readUInt8(1);
      case Types.Subcategory.COMPOUND_FOUR:
      case Types.Subcategory.ARRAY_FOUR:
      case Types.Subcategory.VARIABLE_FOUR:
        return buffer.readUInt32BE(1);
      default:
        throw new Crash(`Category detected as variable width but no size was found`, {
          name: 'ProtocolError',
        });
    }
  }
}
