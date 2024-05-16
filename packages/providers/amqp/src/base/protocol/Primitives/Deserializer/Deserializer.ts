/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { stringify } from 'uuid';
import { Types } from '../..';

/** Deserializer for AMQP elements */
export class Deserializer {
  /**
   * Decodes a buffer into an element
   * @param buffer - buffer to be decoded
   * @returns Element
   */
  public static decode<P extends Types.Primitive, D extends Types.Primitive = never>(
    buffer: Buffer
  ): Types.Decoded<P, D> {
    const constructor = Deserializer.getConstructor(buffer);
    if (constructor.descriptor) {
      const decoded = Deserializer.decode(buffer.subarray(constructor.descriptor.size + 1));
      return {
        ...decoded,
        descriptor: constructor.descriptor,
      } as Types.Decoded<P, D>;
    }
    switch (constructor.type) {
      case Types.Primitive.NULL:
        return Deserializer.decoder(buffer, constructor.type, null) as Types.Decoded<P>;
      case Types.Primitive.BOOLEAN:
        return Deserializer.decoder(
          buffer,
          constructor.type,
          buffer.readUInt8(1) === 0x41
        ) as Types.Decoded<P>;
      case Types.Primitive.TRUE:
        return Deserializer.decoder(buffer, primitive, true) as Types.Decoded<P>;
      case Types.Primitive.FALSE:
        return Deserializer.decoder(buffer, primitive, false) as Types.Decoded<P>;
      case Types.Primitive.UBYTE:
      case Types.Primitive.SMALL_UINT:
      case Types.Primitive.SMALL_ULONG:
        return Deserializer.decoder(buffer, primitive, buffer.readUInt8(1)) as Types.Decoded<P>;
      case Types.Primitive.USHORT:
        return Deserializer.decoder(buffer, primitive, buffer.readUInt16BE(1)) as Types.Decoded<P>;
      case Types.Primitive.UINT:
        return Deserializer.decoder(buffer, primitive, buffer.readUInt32BE(1)) as Types.Decoded<P>;
      case Types.Primitive.UNIT0:
      case Types.Primitive.ULONG0:
        return Deserializer.decoder(buffer, primitive, 0) as Types.Decoded<P>;
      case Types.Primitive.ULONG:
        return Deserializer.decoder(
          buffer,
          primitive,
          buffer.readBigUInt64BE(1)
        ) as Types.Decoded<P>;
      case Types.Primitive.BYTE:
      case Types.Primitive.SMALL_INT:
      case Types.Primitive.SMALL_LONG:
        return Deserializer.decoder(buffer, primitive, buffer.readInt8(1)) as Types.Decoded<P>;
      case Types.Primitive.SHORT:
        return Deserializer.decoder(buffer, primitive, buffer.readInt16BE(1)) as Types.Decoded<P>;
      case Types.Primitive.INT:
        return Deserializer.decoder(buffer, primitive, buffer.readInt32BE(1)) as Types.Decoded<P>;
      case Types.Primitive.LONG:
        return Deserializer.decoder(
          buffer,
          primitive,
          buffer.readBigInt64BE(1)
        ) as Types.Decoded<P>;
      case Types.Primitive.FLOAT:
        return Deserializer.decoder(buffer, primitive, buffer.readFloatBE(1)) as Types.Decoded<P>;
      case Types.Primitive.DOUBLE:
        return Deserializer.decoder(buffer, primitive, buffer.readDoubleBE(1)) as Types.Decoded<P>;
      case Types.Primitive.DECIMAL32:
      case Types.Primitive.DECIMAL64:
      case Types.Primitive.DECIMAL128:
        Deserializer.notImplemented(primitive);
      case Types.Primitive.CHAR:
        return Deserializer.decoder(
          buffer,
          primitive,
          String.fromCharCode(buffer.readUInt32BE(1))
        ) as Types.Decoded<P>;
      case Types.Primitive.TIMESTAMP:
        return Deserializer.decoder(
          buffer,
          primitive,
          new Date(buffer.readBigUInt64BE(1).toString())
        ) as Types.Decoded<P>;
      case Types.Primitive.UUID:
        return Deserializer.decoder(
          buffer,
          primitive,
          stringify(buffer.subarray(1, 17))
        ) as Types.Decoded<P>;
      case Types.Primitive.VBIN8:
        return Deserializer.decoder(
          buffer,
          primitive,
          buffer.subarray(2, buffer.readUInt8(1) + 2)
        ) as Types.Decoded<P>;
      case Types.Primitive.VBIN32:
        return Deserializer.decoder(
          buffer,
          primitive,
          buffer.subarray(5, buffer.readUInt32BE(1) + 5)
        ) as Types.Decoded<P>;
      case Types.Primitive.STR8:
        return Deserializer.decoder(
          buffer,
          primitive,
          buffer.toString('utf8', 2, buffer.readUInt8(1) + 2)
        ) as Types.Decoded<P>;
      case Types.Primitive.STR32:
        return Deserializer.decoder(
          buffer,
          primitive,
          buffer.toString('utf8', 5, buffer.readUInt32BE(1) + 5)
        ) as Types.Decoded<P>;
      case Types.Primitive.SYM8:
        return Deserializer.decoder(
          buffer,
          primitive,
          buffer.toString('ascii', 2, buffer.readUInt8(1) + 2)
        ) as Types.Decoded<P>;
      case Types.Primitive.SYM32:
        return Deserializer.decoder(
          buffer,
          primitive,
          buffer.toString('ascii', 5, buffer.readUInt32BE(1) + 5)
        ) as Types.Decoded<P>;
      case Types.Primitive.LIST0:
        return Deserializer.decoder(buffer, primitive, []) as Types.Decoded<P>;
      case Types.Primitive.LIST8:
      case Types.Primitive.LIST32:
        return Deserializer.list(buffer, primitive) as Types.Decoded<P>;
      case Types.Primitive.MAP8:
      case Types.Primitive.MAP32:
        return Deserializer.map(buffer, primitive) as Types.Decoded<P>;
      case Types.Primitive.ARRAY8:
      case Types.Primitive.ARRAY32:
        return Deserializer.array(buffer, primitive) as Types.Decoded<P>;
      default:
        //@ts-expect-error - Its supposed to be unreachable, but to be safe we throw an error
        throw new Crash(`Unknown code ${code.toString(16)}[${Types.Primitive[code]}]`);
    }
  }
  /**
   * Deserializes a buffer into a list
   * @param buffer - buffer to be deserialized
   * @param width - width of the list
   * @returns list of 32-bit values
   */
  private static list(
    buffer: Buffer,
    primitive: Types.Primitive
  ): Types.Decoded<Types.Primitive.LIST8 | Types.Primitive.LIST32> {
    if (primitive !== Types.Primitive.LIST8 && primitive !== Types.Primitive.LIST32) {
      throw new Crash(`Invalid primitive, expected MAP8 or MAP32 but got ${primitive}`, {
        name: 'ProtocolError',
      });
    }
    return Deserializer.compound(buffer, primitive) as Types.Decoded<
      Types.Primitive.LIST8 | Types.Primitive.LIST32
    >;
  }
  /**
   * Deserializes a buffer into a Record<string, unknown>
   * @param buffer - buffer to be deserialized
   * @param width - width of the map
   * @returns
   */
  private static map(
    buffer: Buffer,
    primitive: Types.Primitive
  ): Types.Decoded<Types.Primitive.MAP8 | Types.Primitive.MAP32> {
    Deserializer.isCodeError(primitive, buffer.readUInt8(0));
    if (primitive !== Types.Primitive.MAP8 && primitive !== Types.Primitive.MAP32) {
      throw new Crash(`Invalid primitive, expected MAP8 or MAP32 but got ${primitive}`, {
        name: 'ProtocolError',
      });
    }
    const compound = Deserializer.compound(buffer, primitive);
    if (!Array.isArray(compound.value)) {
      throw new Crash(`Invalid map type ${typeof compound.value}`, { name: 'ProtocolError' });
    }
    const count = compound.value.length;
    const pairs = compound.value.length / 2;
    if (pairs !== Math.floor(compound.value.length / pairs)) {
      throw new Crash(`Invalid map size ${count}`, { name: 'ProtocolError' });
    }
    const map: Record<string, unknown> = {};
    for (let i = 0; i < pairs; i++) {
      const key = compound.value[i * 2];
      const value = compound.value[i * 2 + 1];
      if (typeof key !== 'string') {
        throw new Crash(`Invalid key type ${typeof key}`, { name: 'ProtocolError' });
      }
      map[key] = value;
    }
    if (new Set(Object.keys(map)).size !== pairs) {
      throw new Crash(`Duplicate keys in map`, { name: 'ProtocolError' });
    }
    return {
      type: primitive,
      size: compound.size,
      descriptor: null,
      value: map,
    } as Types.Decoded<Types.Primitive.MAP8 | Types.Primitive.MAP32>;
  }
  private static variableWidth(
    buffer: Buffer,
    primitive: Types.VariableWidth
  ): Types.Decoded<Types.VariableWidth> {
    const subcategory: Types.Subcategory = primitive >> 4;
    if (
      subcategory !== Types.Subcategory.VARIABLE_ONE &&
      subcategory !== Types.Subcategory.VARIABLE_FOUR
    ) {
      throw new Crash(
        `Invalid primitive, expected VARIABLE_ONE or VARIABLE_FOUR but got ${Types.Subcategory[subcategory]}/[${subcategory.toString(16)}]`,
        { name: 'ProtocolError' }
      );
    }
    const size = Deserializer.getVariableSize(buffer, primitive);
    const value = buffer.toString('utf8', 1, size);
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
  private static compound(
    buffer: Buffer,
    primitive: Types.Compound
  ): Types.Decoded<Types.Compound> {
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
    const size = Types.Subcategory.COMPOUND_ONE ? buffer.readUInt8(1) : buffer.readUInt32BE(1);
    const count =
      subcategory === Types.Subcategory.COMPOUND_ONE ? buffer.readUInt8(2) : buffer.readUInt32BE(5);
    const elements: Types.Decoded<any>[] = [];
    let offset = subcategory === Types.Subcategory.COMPOUND_ONE ? 3 : 9;
    for (let index = 0; index < count; index++) {
      const element = Deserializer.decode(buffer.subarray(offset));
      elements.push(element);
      offset += element.size;
    }
    return {
      type: primitive,
      descriptor: null,
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
   * @param width - width of the array
   * @returns array of 32-bit values
   */
  private static array(buffer: Buffer, primitive: Types.Array): Types.Decoded<Types.Array> {
    Deserializer.isCodeError(primitive, buffer.readUInt8(0));
    if (primitive !== Types.Primitive.ARRAY8 && primitive !== Types.Primitive.ARRAY32) {
      throw new Crash(`Invalid primitive, expected ARRAY8 or ARRAY32 but got ${primitive}`, {
        name: 'ProtocolError',
      });
    }
    const size = Deserializer.getVariableSize(buffer, primitive);
    const count =
      primitive === Types.Primitive.ARRAY8 ? buffer.readUInt8(2) : buffer.readUInt32BE(5);
    const elements: Types.Decoded<any>[] = [];
    let offset = primitive === Types.Primitive.ARRAY8 ? 3 : 9;
    for (let i = 0; i < count; i++) {
      const element = Deserializer.decode(buffer.subarray(offset));
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
   * Decodes a buffer into an element
   * @param buffer - buffer to be decoded
   * @param options - options for the decoder
   * @returns DecodedElement
   */
  private static decoder<T extends Types.Primitive>(
    buffer: Buffer,
    primitive: T,
    value: Types.PrimitiveBasedValue<T>
  ): Types.Decoded<T> {
    Deserializer.isCodeError(primitive, buffer.readUInt8(0));
    const size = Deserializer.getSize(buffer, primitive);
    if (value === undefined) {
      throw new Crash(`Error decoding element, value is undefined`, {
        name: 'ProtocolError',
      });
    }
    return {
      type: primitive,
      size,
      value,
    };
  }
  /**
   * Get the constructor of the type from the beginning of the buffer
   * The constructors are encoded on one of the following formats:
   * - Primitive format code (string)
   * ```plaintext
   *           constructor            untyped bytes
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
   * @param buffer - buffer to check
   * @returns
   */
  private static getConstructor(buffer: Buffer): Types.Constructor<any, any> {
    const constructor = buffer.readUInt8(0);
    if (constructor === 0) {
      const descriptor = Deserializer.decode(buffer.subarray(1));
      return {
        type: buffer.readUInt8(descriptor.size),
        descriptor,
      };
    } else {
      return {
        type: constructor,
        descriptor: null,
      };
    }
  }
  /**
   * Gets the size of the primitive
   * @param buffer - buffer to check
   * @param primitive - primitive to check
   * @returns size of the primitive
   */
  private static getSize<T extends Types.Primitive>(buffer: Buffer, primitive: T): number {
    return (
      (Deserializer.isFixedWidth(primitive)
        ? Deserializer.getFixedSize(primitive)
        : Deserializer.getVariableSize(buffer, primitive)) + 1
    );
  }
  /**
   * Checks if the primitive is simple width
   * @param primitive - primitive to check
   * @returns if the primitive is simple width
   */
  private static isFixedWidth<T extends Types.Primitive>(primitive: T): boolean {
    return primitive <= 0x09;
  }
  /**
   * Gets the size of the fixed width primitive
   * @param primitive - primitive to check
   * @returns size of the fixed width primitive
   */
  private static getFixedSize<T extends Types.Primitive>(primitive: T): number {
    switch (primitive >> 4) {
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
   * Gets the size of the variable width primitive
   * @param primitive - primitive to check
   * @returns size of the variable width primitive
   */
  private static getVariableSize<T extends Types.Primitive>(buffer: Buffer, primitive: T): number {
    switch (primitive >> 4) {
      case Types.Subcategory.VARIABLE_ONE:
        return buffer.readUInt8(1);
      case Types.Subcategory.VARIABLE_FOUR:
        return buffer.readUInt32BE(1);
      case Types.Subcategory.ARRAY_ONE:
      case Types.Subcategory.COMPOUND_ONE:
        return buffer.readUInt8(1) + 1;
      case Types.Subcategory.COMPOUND_FOUR:
      case Types.Subcategory.ARRAY_FOUR:
        return buffer.readUInt32BE(1) + 4;
      default:
        throw new Crash(`Category detected as variable width but no size was found`, {
          name: 'ProtocolError',
        });
    }
  }
  /**
   * Throws an error if the expected code does not match the received code
   * @param expected - The expected code
   * @param got - The code that was received
   * @returns never
   * @throws Crash
   */
  private static isCodeError(expected: number | number[], got: number): void {
    const _expected = Array.isArray(expected) ? expected : [expected];
    if (_expected.includes(got)) {
      return;
    }
    throw new Crash(
      `Expected code ${_expected.map(code => code.toString(16)).join(', ')} but got ${got.toString(16)}`
    );
  }
  /**
   * Throws an error if the decoder is not implemented
   * @param options - The options for the decoder
   * @returns never
   * @throws Crash
   */
  private static notImplemented(primitive: Types.Primitive): never {
    throw new Crash(`Decoder for ${Types.Primitive[primitive]} is not implemented`, {
      name: 'NotImplemented',
    });
  }
}
