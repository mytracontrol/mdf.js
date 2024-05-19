/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { cloneDeep } from 'lodash';
import { Types } from '../..';
import { Parser } from './Parser';

/** Size of a primitive field in bytes */
const PRIMITIVE_SIZE = 1;
/** Offset of the subcategory in a primitive field in bits */
const SUBCATEGORY_OFFSET = 4;

export class Constructors {
  /**
   * Serializes a primitive into a buffer
   * @param unencoded - unencoded value that represents a primitive type to be serialized
   * @returns buffer with the serialized value
   */
  public static encode<P extends Types.Primitive = any, D extends Types.Primitive = never>(
    unencoded: Types.Unencoded<P, D> | Types.Unencoded<P>
  ): Buffer {
    const subcategory = Constructors.getSubcategory(unencoded.type);
    if (unencoded.descriptor !== null) {
      return Constructors.descriptor(
        unencoded as Types.Unencoded<Types.Primitive, Types.Primitive>
      );
    } else if (
      subcategory >= Types.Subcategory.EMPTY &&
      subcategory <= Types.Subcategory.FIXED_SIXTEEN
    ) {
      return Constructors.fixedWidth(unencoded as Types.Unencoded<Types.FixedWidth>);
    } else if (
      subcategory === Types.Subcategory.VARIABLE_ONE ||
      subcategory === Types.Subcategory.VARIABLE_FOUR
    ) {
      return Constructors.variableWidth(
        unencoded as unknown as Types.Unencoded<Types.VariableWidth>
      );
    } else if (
      subcategory === Types.Subcategory.COMPOUND_ONE ||
      subcategory === Types.Subcategory.COMPOUND_FOUR
    ) {
      return Constructors.compound(unencoded as unknown as Types.Unencoded<Types.Compound>);
    } else if (
      subcategory === Types.Subcategory.ARRAY_ONE ||
      subcategory === Types.Subcategory.ARRAY_FOUR
    ) {
      return Constructors.array(unencoded as unknown as Types.Unencoded<Types.Array>);
    } else {
      throw new Crash(
        `Invalid primitive, expected one of supported primitive but got [${Types.Subcategory[subcategory]}]/[${subcategory.toString(16)}]`,
        { name: 'ProtocolError' }
      );
    }
  }
  /**
   * Serializes a primitive into a buffer
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
   * @param unencoded - unencoded value that represents a primitive type to be serialized
   * @returns decoded primitive
   */
  private static descriptor(unencoded: Types.Unencoded<Types.Primitive, Types.Primitive>): Buffer {
    if (!unencoded.descriptor) {
      throw new Crash(
        `Invalid primitive, expected a DESCRIPTOR but got a primitive without a descriptor [${unencoded.type}]`,
        { name: 'ProtocolError' }
      );
    }
    const buffer = Buffer.alloc(PRIMITIVE_SIZE);
    buffer.writeUInt8(0);
    const descriptorBuffer = Constructors.encode(unencoded.descriptor);
    const cloneDecoded = cloneDeep(unencoded);
    // Remove the descriptor to avoid infinite recursion
    //@ts-ignore - We know that descriptor should be null
    cloneDecoded.descriptor = null;
    const data = Constructors.encode(cloneDecoded);
    return Buffer.concat([buffer, descriptorBuffer, data]);
  }
  /**
   * Serializes a primitive into a buffer
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
   * @param unencoded - unencoded value that represents a primitive type to be serialized
   * @returns decoded fixed width
   */
  private static fixedWidth(unencoded: Types.Unencoded<Types.FixedWidth>): Buffer {
    const subcategory = Constructors.getSubcategory(unencoded.type);
    if (subcategory > Types.Subcategory.FIXED_SIXTEEN || subcategory < Types.Subcategory.EMPTY) {
      throw new Crash(
        `Invalid primitive, expected a fixed width but got [${Types.Subcategory[subcategory]}]/[${subcategory.toString(16)}]`,
        { name: 'ProtocolError' }
      );
    }
    const buffer = Buffer.alloc(PRIMITIVE_SIZE);
    buffer.writeUInt8(unencoded.type);
    const data = Parser.parse(unencoded.value, unencoded.type);
    return Buffer.concat([buffer, data]);
  }
  /**
   * Serializes a primitive into a buffer
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
   * @param unencoded - unencoded value that represents a primitive type to be serialized
   * @returns decoded variable width
   */
  private static variableWidth(unencoded: Types.Unencoded<Types.VariableWidth>): Buffer {
    const subcategory = Constructors.getSubcategory(unencoded.type);
    if (
      subcategory !== Types.Subcategory.VARIABLE_ONE &&
      subcategory !== Types.Subcategory.VARIABLE_FOUR
    ) {
      throw new Crash(
        `Invalid primitive, expected VARIABLE_ONE or VARIABLE_FOUR but got [${Types.Subcategory[subcategory]}]/[${subcategory.toString(16)}]`,
        { name: 'ProtocolError' }
      );
    }
    const buffer = Buffer.alloc(PRIMITIVE_SIZE);
    buffer.writeUInt8(unencoded.type);
    const data = Parser.parse(unencoded.value, unencoded.type);
    return Buffer.concat([buffer, data]);
  }
  /**
   * Serializes a primitive into a buffer
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
   * @param unencoded - unencoded value that represents a primitive type to be serialized
   * @returns decoded list
   */
  private static compound(unencoded: Types.Unencoded<Types.Compound>): Buffer {
    const subcategory = Constructors.getSubcategory(unencoded.type);
    if (
      subcategory !== Types.Subcategory.COMPOUND_ONE &&
      subcategory !== Types.Subcategory.COMPOUND_FOUR
    ) {
      throw new Crash(
        `Invalid primitive, expected COMPOUND_ONE or COMPOUND_FOUR but got [${Types.Subcategory[subcategory]}]/[${subcategory.toString(16)}]`,
        { name: 'ProtocolError' }
      );
    }
    if (!Array.isArray(unencoded.value)) {
      throw new Crash('Invalid compound value, expected an array', { name: 'ProtocolError' });
    }
    const subcategoryWidth = Constructors.getSubcategoryWidth(subcategory);
    let data = Buffer.alloc(0);
    for (const element of unencoded.value) {
      const elementBuffer = Constructors.encode(element as Types.Unencoded<any>);
      data = Buffer.concat([data, elementBuffer]);
    }
    const buffer = Buffer.alloc(PRIMITIVE_SIZE + subcategoryWidth * 2);
    buffer.writeUInt8(unencoded.type);
    if (subcategory === Types.Subcategory.COMPOUND_ONE) {
      buffer.writeUInt8(data.length + subcategoryWidth, PRIMITIVE_SIZE);
      buffer.writeUInt8(unencoded.value.length, PRIMITIVE_SIZE + subcategoryWidth);
    } else {
      buffer.writeUInt32BE(data.length + subcategoryWidth, PRIMITIVE_SIZE);
      buffer.writeUInt32BE(unencoded.value.length, PRIMITIVE_SIZE + subcategoryWidth);
    }
    return Buffer.concat([buffer, data]);
  }
  /**
   * Serializes a primitive into a buffer
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
   * @param unencoded - unencoded value that represents a primitive type to be serialized
   * @returns decoded array
   */
  private static array(unencoded: Types.Unencoded<Types.Array>): Buffer {
    const subcategory = Constructors.getSubcategory(unencoded.type);
    if (
      subcategory !== Types.Subcategory.ARRAY_ONE &&
      subcategory !== Types.Subcategory.ARRAY_FOUR
    ) {
      throw new Crash(
        `Invalid primitive, expected ARRAY_ONE or ARRAY_FOUR but got [${Types.Subcategory[subcategory]}]/[${subcategory.toString(16)}]`,
        { name: 'ProtocolError' }
      );
    }
    if (!Array.isArray(unencoded.value)) {
      throw new Crash('Invalid array value, expected an array', { name: 'ProtocolError' });
    }
    // Check that all the elements have the same type
    const elementConstructor = (unencoded.value[0] as Types.Unencoded).type;
    if (
      !unencoded.value.every(element => (element as Types.Unencoded).type === elementConstructor)
    ) {
      throw new Crash('Invalid array value, all elements must have the same type', {
        name: 'ProtocolError',
      });
    }
    const subcategoryWidth = Constructors.getSubcategoryWidth(subcategory);
    let data = Buffer.alloc(0);
    for (const element of unencoded.value) {
      const elementBuffer = Constructors.encode(element as Types.Unencoded<any>);
      data = Buffer.concat([data, elementBuffer.subarray(PRIMITIVE_SIZE)]);
    }
    const buffer = Buffer.alloc(PRIMITIVE_SIZE + subcategoryWidth * 2 + PRIMITIVE_SIZE);
    buffer.writeUInt8(unencoded.type);
    if (subcategory === Types.Subcategory.ARRAY_ONE) {
      buffer.writeUInt8(data.length + subcategoryWidth + PRIMITIVE_SIZE, PRIMITIVE_SIZE);
      buffer.writeUInt8(unencoded.value.length, PRIMITIVE_SIZE + subcategoryWidth);
    } else {
      buffer.writeUInt32BE(data.length + subcategoryWidth + PRIMITIVE_SIZE, PRIMITIVE_SIZE);
      buffer.writeUInt32BE(unencoded.value.length, PRIMITIVE_SIZE + subcategoryWidth);
    }
    buffer.writeUInt8(elementConstructor, PRIMITIVE_SIZE + subcategoryWidth * 2);
    return Buffer.concat([buffer, data]);
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
}
