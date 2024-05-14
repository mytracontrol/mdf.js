/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { stringify } from 'uuid';
import { Element, PrimitiveBasedValue, Primitives, Subcategory } from '..';

/** Deserializer for AMQP elements */
export class Deserializer {
  /**
   * Decodes a buffer into an element
   * @param buffer - buffer to be decoded
   * @returns Element
   */
  public static decode<T extends Primitives>(buffer: Buffer): Element<T> {
    const primitive = buffer.readUInt8(0) as Primitives;
    switch (primitive) {
      case Primitives.NULL:
        return Deserializer.decoder(buffer, primitive, null) as Element<T>;
      case Primitives.BOOLEAN:
        return Deserializer.decoder(buffer, primitive, buffer.readUInt8(1) === 0x41) as Element<T>;
      case Primitives.TRUE:
        return Deserializer.decoder(buffer, primitive, true) as Element<T>;
      case Primitives.FALSE:
        return Deserializer.decoder(buffer, primitive, false) as Element<T>;
      case Primitives.UBYTE:
      case Primitives.SMALL_UINT:
      case Primitives.SMALL_ULONG:
        return Deserializer.decoder(buffer, primitive, buffer.readUInt8(1)) as Element<T>;
      case Primitives.USHORT:
        return Deserializer.decoder(buffer, primitive, buffer.readUInt16BE(1)) as Element<T>;
      case Primitives.UINT:
        return Deserializer.decoder(buffer, primitive, buffer.readUInt32BE(1)) as Element<T>;
      case Primitives.UNIT0:
      case Primitives.ULONG0:
        return Deserializer.decoder(buffer, primitive, 0) as Element<T>;
      case Primitives.ULONG:
        return Deserializer.decoder(buffer, primitive, buffer.readBigUInt64BE(1)) as Element<T>;
      case Primitives.BYTE:
      case Primitives.SMALL_INT:
      case Primitives.SMALL_LONG:
        return Deserializer.decoder(buffer, primitive, buffer.readInt8(1)) as Element<T>;
      case Primitives.SHORT:
        return Deserializer.decoder(buffer, primitive, buffer.readInt16BE(1)) as Element<T>;
      case Primitives.INT:
        return Deserializer.decoder(buffer, primitive, buffer.readInt32BE(1)) as Element<T>;
      case Primitives.LONG:
        return Deserializer.decoder(buffer, primitive, buffer.readBigInt64BE(1)) as Element<T>;
      case Primitives.FLOAT:
        return Deserializer.decoder(buffer, primitive, buffer.readFloatBE(1)) as Element<T>;
      case Primitives.DOUBLE:
        return Deserializer.decoder(buffer, primitive, buffer.readDoubleBE(1)) as Element<T>;
      case Primitives.DECIMAL32:
      case Primitives.DECIMAL64:
      case Primitives.DECIMAL128:
        Deserializer.notImplemented(primitive);
      case Primitives.CHAR:
        return Deserializer.decoder(
          buffer,
          primitive,
          String.fromCharCode(buffer.readUInt32BE(1))
        ) as Element<T>;
      case Primitives.TIMESTAMP:
        return Deserializer.decoder(
          buffer,
          primitive,
          new Date(buffer.readBigUInt64BE(1).toString())
        ) as Element<T>;
      case Primitives.UUID:
        return Deserializer.decoder(
          buffer,
          primitive,
          stringify(buffer.subarray(1, 17))
        ) as Element<T>;
      case Primitives.VBIN8:
        return Deserializer.decoder(
          buffer,
          primitive,
          buffer.subarray(2, buffer.readUInt8(1) + 2)
        ) as Element<T>;
      case Primitives.VBIN32:
        return Deserializer.decoder(
          buffer,
          primitive,
          buffer.subarray(5, buffer.readUInt32BE(1) + 5)
        ) as Element<T>;
      case Primitives.STR8:
        return Deserializer.decoder(
          buffer,
          primitive,
          buffer.toString('utf8', 2, buffer.readUInt8(1) + 2)
        ) as Element<T>;
      case Primitives.STR32:
        return Deserializer.decoder(
          buffer,
          primitive,
          buffer.toString('utf8', 5, buffer.readUInt32BE(1) + 5)
        ) as Element<T>;
      case Primitives.SYM8:
        return Deserializer.decoder(
          buffer,
          primitive,
          buffer.toString('ascii', 2, buffer.readUInt8(1) + 2)
        ) as Element<T>;
      case Primitives.SYM32:
        return Deserializer.decoder(
          buffer,
          primitive,
          buffer.toString('ascii', 5, buffer.readUInt32BE(1) + 5)
        ) as Element<T>;
      case Primitives.LIST0:
        return Deserializer.decoder(buffer, primitive, []) as Element<T>;
      case Primitives.LIST8:
      case Primitives.LIST32:
        return Deserializer.list(buffer, primitive) as Element<T>;
      case Primitives.MAP8:
      case Primitives.MAP32:
        return Deserializer.map(buffer, primitive) as Element<T>;
      case Primitives.ARRAY8:
      case Primitives.ARRAY32:
        return Deserializer.array(buffer, primitive) as Element<T>;
      default:
        //@ts-expect-error - Its supposed to be unreachable, but to be safe we throw an error
        throw new Crash(`Unknown code ${code.toString(16)}[${Primitives[code]}]`);
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
    primitive: Primitives
  ): Element<Primitives.LIST8 | Primitives.LIST32> {
    Deserializer.isCodeError(primitive, buffer.readUInt8(0));
    if (primitive !== Primitives.LIST8 && primitive !== Primitives.LIST32) {
      throw new Crash(`Invalid primitive, expected LIST8 or LIST32 but got ${primitive}`, {
        name: 'ProtocolError',
      });
    }
    const size = this.getVariableSize(buffer, primitive);
    const count = primitive === Primitives.LIST8 ? buffer.readUInt8(2) : buffer.readUInt32BE(5);
    const elements: Element<any>[] = [];
    let offset = primitive === Primitives.LIST8 ? 3 : 9;
    for (let index = 0; index < count; index++) {
      const element = Deserializer.decode(buffer.subarray(offset));
      elements.push(element);
      offset += element.size;
    }
    return {
      primitive,
      size,
      value: elements,
    };
  }
  /**
   * Deserializes a buffer into a Record<string, unknown>
   * @param buffer - buffer to be deserialized
   * @param width - width of the map
   * @returns
   */
  private static map(
    buffer: Buffer,
    primitive: Primitives
  ): Element<Primitives.MAP8 | Primitives.MAP32> {
    Deserializer.isCodeError(primitive, buffer.readUInt8(0));
    if (primitive !== Primitives.MAP8 && primitive !== Primitives.MAP32) {
      throw new Crash(`Invalid primitive, expected MAP8 or MAP32 but got ${primitive}`, {
        name: 'ProtocolError',
      });
    }
    const size = this.getVariableSize(buffer, primitive);
    const count = primitive === Primitives.MAP8 ? buffer.readUInt8(2) : buffer.readUInt32BE(5);
    const pairs = count / 2;
    if (pairs !== Math.floor(pairs)) {
      throw new Crash(`Invalid map size ${count}`, { name: 'ProtocolError' });
    }
    const map: Record<string, unknown> = {};
    let offset = primitive === Primitives.MAP8 ? 3 : 9;
    for (let index = 0; index < pairs; index++) {
      const key = Deserializer.decode(buffer.subarray(offset));
      offset += key.size;
      const value = Deserializer.decode(buffer.subarray(offset));
      offset += value.size;
      map[key.value as string] = value.value;
    }
    return {
      primitive,
      size,
      value: map,
    };
  }
  /**
   * Deserializes a buffer into an array
   * @param buffer - buffer to be deserialized
   * @param width - width of the array
   * @returns array of 32-bit values
   */
  private static array(
    buffer: Buffer,
    primitive: Primitives
  ): Element<Primitives.ARRAY8 | Primitives.ARRAY32> {
    Deserializer.isCodeError(primitive, buffer.readUInt8(0));
    if (primitive !== Primitives.ARRAY8 && primitive !== Primitives.ARRAY32) {
      throw new Crash(`Invalid primitive, expected ARRAY8 or ARRAY32 but got ${primitive}`, {
        name: 'ProtocolError',
      });
    }
    const size = Deserializer.getVariableSize(buffer, primitive);
    const count = primitive === Primitives.ARRAY8 ? buffer.readUInt8(2) : buffer.readUInt32BE(5);
    const elements: Element<any>[] = [];
    let offset = primitive === Primitives.ARRAY8 ? 3 : 9;
    for (let i = 0; i < count; i++) {
      const element = Deserializer.decode(buffer.subarray(offset));
      elements.push(element);
      offset += element.size;
    }
    return {
      primitive,
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
  private static decoder<T extends Primitives>(
    buffer: Buffer,
    primitive: T,
    value: PrimitiveBasedValue<T>
  ): Element<T> {
    Deserializer.isCodeError(primitive, buffer.readUInt8(0));
    const size = Deserializer.getSize(buffer, primitive);
    if (value === undefined) {
      throw new Crash(`Error decoding element, value is undefined`, {
        name: 'ProtocolError',
      });
    }
    return {
      primitive,
      size,
      value,
    };
  }
  /**
   * Gets the size of the primitive
   * @param buffer - buffer to check
   * @param primitive - primitive to check
   * @returns size of the primitive
   */
  private static getSize<T extends Primitives>(buffer: Buffer, primitive: T): number {
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
  private static isFixedWidth<T extends Primitives>(primitive: T): boolean {
    return primitive <= 0x09;
  }
  /**
   * Gets the size of the fixed width primitive
   * @param primitive - primitive to check
   * @returns size of the fixed width primitive
   */
  private static getFixedSize<T extends Primitives>(primitive: T): number {
    switch (primitive >> 4) {
      case Subcategory.EMPTY:
        return 0;
      case Subcategory.FIXED_ONE:
        return 1;
      case Subcategory.FIXED_TWO:
        return 2;
      case Subcategory.FIXED_FOUR:
        return 4;
      case Subcategory.FIXED_EIGHT:
        return 8;
      case Subcategory.FIXED_SIXTEEN:
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
  private static getVariableSize<T extends Primitives>(buffer: Buffer, primitive: T): number {
    switch (primitive >> 4) {
      case Subcategory.VARIABLE_ONE:
        return buffer.readUInt8(1);
      case Subcategory.VARIABLE_FOUR:
        return buffer.readUInt32BE(1);
      case Subcategory.ARRAY_ONE:
      case Subcategory.COMPOUND_ONE:
        return buffer.readUInt8(1) + 1;
      case Subcategory.COMPOUND_FOUR:
      case Subcategory.ARRAY_FOUR:
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
  private static notImplemented(primitive: Primitives): never {
    throw new Crash(`Decoder for ${Primitives[primitive]} is not implemented`, {
      name: 'NotImplemented',
    });
  }
}
