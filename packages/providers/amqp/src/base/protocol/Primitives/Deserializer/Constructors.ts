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
   * Deserializes a buffer into a primitive
   * @param buffer - buffer to be deserialized
   * @returns decoded primitive
   */
  public static decode<P extends Types.Primitive = any, D extends Types.Primitive = never>(
    buffer: Buffer
  ): Types.Decoded<P, D> | Types.Decoded<P> {
    if (!buffer || Buffer.isBuffer(buffer) === false || buffer.length === 0) {
      const got = Buffer.isBuffer(buffer) ? 'an empty buffer' : `[${typeof buffer}]`;
      throw new Crash(`Invalid buffer, expected a non-empty buffer but got ${got}`, {
        name: 'ProtocolError',
      });
    }
    const primitive = buffer.readUInt8(0);
    const subcategory = Constructors.getSubcategory(primitive);
    if (subcategory === Types.Subcategory.DESCRIPTOR) {
      return Constructors.descriptor(buffer, primitive) as Types.Decoded<P, D>;
    } else if (
      subcategory >= Types.Subcategory.EMPTY &&
      subcategory <= Types.Subcategory.FIXED_SIXTEEN
    ) {
      return Constructors.fixedWidth(buffer, primitive) as Types.Decoded<P>;
    } else if (
      subcategory === Types.Subcategory.VARIABLE_ONE ||
      subcategory === Types.Subcategory.VARIABLE_FOUR
    ) {
      return Constructors.variableWidth(buffer, primitive) as Types.Decoded<P>;
    } else if (
      subcategory === Types.Subcategory.COMPOUND_ONE ||
      subcategory === Types.Subcategory.COMPOUND_FOUR
    ) {
      return Constructors.compound(buffer, primitive) as Types.Decoded<P>;
    } else if (
      subcategory === Types.Subcategory.ARRAY_ONE ||
      subcategory === Types.Subcategory.ARRAY_FOUR
    ) {
      return Constructors.array(buffer, primitive) as Types.Decoded<P>;
    } else {
      throw new Crash(
        `Invalid primitive, expected one of supported primitive but got [${Types.Subcategory[subcategory]}]/[${subcategory.toString(16)}]`,
        { name: 'ProtocolError' }
      );
    }
  }
  /**
   * Deserializes a buffer into a type that has a descriptor
   * An AMQP constructor consists of either a primitive format code, or a described format code. A
   * primitive format code is a constructor for an AMQP primitive type. A described format code
   * consists of a descriptor and a primitive format-code. A descriptor defines how to produce a
   * domain specific type from an AMQP primitive value.
   * - Primitive format code (String)
   * ```plaintext
   *        constructor            untyped bytes
   *             |                      |
   *           +--+   +-----------------+-----------------+
   *           |  |   |                                   |
   *      ...  0xA1   0x1E "Hello Glorious Messaging World"  ...
   *            |     |  |              |                 |
   *            |     |  |         utf8 bytes             |
   *            |     |  |                                |
   *            |     | # of data octets                  |
   *            |     |                                   |
   *            |     +-----------------+-----------------+
   *            |                       |
   *            |        string value encoded according
   *            |          to the str8-utf8 encoding
   *            |
   *   primitive format code
   * for the str8-utf8 encoding
   * ```
   * - Described format code (URL)
   * ```plaintext
   *             constructor                       untyped bytes
   *                  |                                 |
   *      +-----------+-----------+   +-----------------+-----------------+
   *      |                       |   |                                   |
   * ...  0x00 0xA1 0x03 "URL" 0xA1   0x1E "http://example.org/hello-world"  ...
   *           |             |  |     |                                   |
   *           +------+------+  |     |                                   |
   *                  |         |     |                                   |
   *             descriptor     |     +------------------+----------------+
   *                            |                        |
   *                            |         string value encoded according
   *                            |           to the str8-utf8 encoding
   *                            |
   *                   primitive format code
   *                 for the str8-utf8 encoding
   *
   * (Note: this example shows a string-typed descriptor, which is considered reserved)
   * ```
   * @param buffer - buffer to be deserialized
   * @param primitive - primitive to be deserialized
   * @returns decoded primitive
   */
  private static descriptor(
    buffer: Buffer,
    primitive: Types.Descriptor
  ): Types.Decoded<Types.Primitive, Types.Primitive> {
    const subcategory = Constructors.getSubcategory(primitive);
    if (subcategory !== Types.Subcategory.DESCRIPTOR) {
      throw new Crash(
        `Invalid primitive, expected a DESCRIPTOR but got [${Types.Subcategory[subcategory]}]/[${subcategory.toString(16)}]`,
        { name: 'ProtocolError' }
      );
    }
    const descriptor = Constructors.decode(buffer.subarray(PRIMITIVE_SIZE));
    const decoded = Constructors.decode(
      buffer.subarray(descriptor.size + PRIMITIVE_SIZE)
    ) as Types.Decoded<Types.Primitive, Types.Primitive>;
    decoded.descriptor = descriptor;
    return decoded;
  }
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
   * @returns decoded fixed width
   */
  private static fixedWidth(
    buffer: Buffer,
    primitive: Types.FixedWidth
  ): Types.Decoded<Types.FixedWidth> {
    const subcategory = Constructors.getSubcategory(primitive);
    if (subcategory > Types.Subcategory.FIXED_SIXTEEN || subcategory < Types.Subcategory.EMPTY) {
      throw new Crash(
        `Invalid primitive, expected a fixed width but got [${Types.Subcategory[subcategory]}]/[${subcategory.toString(16)}]`,
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
   * @returns decoded variable width
   */
  private static variableWidth(
    buffer: Buffer,
    primitive: Types.VariableWidth
  ): Types.Decoded<Types.VariableWidth> {
    const subcategory = Constructors.getSubcategory(primitive);
    if (
      subcategory !== Types.Subcategory.VARIABLE_ONE &&
      subcategory !== Types.Subcategory.VARIABLE_FOUR
    ) {
      throw new Crash(
        `Invalid primitive, expected VARIABLE_ONE or VARIABLE_FOUR but got [${Types.Subcategory[subcategory]}]/[${subcategory.toString(16)}]`,
        { name: 'ProtocolError' }
      );
    }
    const subcategoryWidth = Constructors.getSubcategoryWidth(subcategory);
    const width = Constructors.getDataWidth(buffer, subcategory);
    const size = subcategoryWidth + width + PRIMITIVE_SIZE;
    const valueBuffer = buffer.subarray(subcategoryWidth + PRIMITIVE_SIZE, size);
    const value = Parser.parse(valueBuffer, primitive);
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
   * @returns decoded list
   */
  private static compound(
    buffer: Buffer,
    primitive: Types.Compound
  ): Types.Decoded<Types.Compound> {
    const subcategory = Constructors.getSubcategory(primitive);
    if (
      subcategory !== Types.Subcategory.COMPOUND_ONE &&
      subcategory !== Types.Subcategory.COMPOUND_FOUR
    ) {
      throw new Crash(
        `Invalid primitive, expected COMPOUND_ONE or COMPOUND_FOUR but got [${Types.Subcategory[subcategory]}]/[${subcategory.toString(16)}]`,
        { name: 'ProtocolError' }
      );
    }
    const subcategoryWidth = Constructors.getSubcategoryWidth(subcategory);
    const width = Constructors.getDataWidth(buffer, subcategory) - subcategoryWidth;
    const size = subcategoryWidth * 2 + width + PRIMITIVE_SIZE;
    const count = Constructors.getCount(buffer, subcategory);

    const elements: Types.Decoded<any>[] = [];
    let offset = subcategoryWidth * 2 + PRIMITIVE_SIZE;
    for (let index = 0; index < count; index++) {
      const elementBuffer = buffer.subarray(offset);
      const element = Constructors.decode(elementBuffer);
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
   * @returns decoded array
   */
  private static array(buffer: Buffer, primitive: Types.Array): Types.Decoded<Types.Array> {
    const subcategory = Constructors.getSubcategory(primitive);
    if (
      subcategory !== Types.Subcategory.ARRAY_ONE &&
      subcategory !== Types.Subcategory.ARRAY_FOUR
    ) {
      throw new Crash(
        `Invalid primitive, expected ARRAY_ONE or ARRAY_FOUR but got [${Types.Subcategory[subcategory]}]/[${subcategory.toString(16)}]`,
        { name: 'ProtocolError' }
      );
    }
    const subcategoryWidth = Constructors.getSubcategoryWidth(subcategory);
    const width = Constructors.getDataWidth(buffer, subcategory) - subcategoryWidth;
    const size = subcategoryWidth * 2 + width + PRIMITIVE_SIZE;
    const count = Constructors.getCount(buffer, subcategory);

    const elements: Types.Decoded<any>[] = [];
    let offset = subcategoryWidth * 2 + PRIMITIVE_SIZE;
    const elementConstructorBuffer = Buffer.from([buffer.readUInt8(offset)]);
    offset += PRIMITIVE_SIZE;

    for (let index = 0; index < count; index++) {
      const elementBuffer = buffer.subarray(offset);
      const element = Constructors.decode(Buffer.concat([elementConstructorBuffer, elementBuffer]));
      elements.push(element);
      offset += element.size - PRIMITIVE_SIZE;
    }

    return {
      type: primitive,
      descriptor: null,
      width,
      size,
      value: elements,
    } as Types.Decoded<Types.Array>;
  }
  /**
   * Gets the subcategory of a primitive
   * @param primitive - primitive to be deserialized
   * @returns subcategory of the primitive
   */
  private static getSubcategory(primitive: Types.Primitive): Types.Subcategory {
    return primitive >> SUBCATEGORY_OFFSET;
  }
  /**
   * Gets the width of a subcategory, this means the number of octets that the subcategory occupies
   * including the size and count fields
   * @param subcategory - subcategory of the primitive
   * @returns width of the subcategory
   */
  private static getSubcategoryWidth(subcategory: Types.Subcategory): number {
    if (subcategory <= Types.Subcategory.FIXED_SIXTEEN) {
      return 0;
    } else if (
      subcategory === Types.Subcategory.VARIABLE_FOUR ||
      subcategory === Types.Subcategory.COMPOUND_FOUR ||
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
      subcategory === Types.Subcategory.COMPOUND_FOUR ||
      subcategory === Types.Subcategory.ARRAY_FOUR
    ) {
      return buffer.readUInt32BE(5);
    } else {
      return buffer.readUInt8(2);
    }
  }
  /**
   * Gets the size of data in a primitive based on its subcategory and the size field from the
   * buffer
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
