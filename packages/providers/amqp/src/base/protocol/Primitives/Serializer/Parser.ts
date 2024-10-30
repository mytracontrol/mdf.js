/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { parse } from 'uuid';
import { Types } from '../..';

/** Serializer for AMQP elements */
export class Parser {
  /**
   * Serializes the given value
   * @param value The value to serialize
   * @param primitive The type of the value
   * @returns The serialized value
   */
  public static parse(value: unknown, primitive: Types.Primitive): Buffer {
    let buffer: Buffer;
    switch (primitive) {
      // size: 1, code: 0x41
      case Types.Primitive.TRUE:
      // size: 1, code: 0x42
      case Types.Primitive.FALSE:
      // size: 1, code: 0x40
      case Types.Primitive.NULL:
      // size: 1, code: 0x43
      case Types.Primitive.UNIT0:
      // size: 1, code: 0x44
      case Types.Primitive.ULONG0:
      // size: 1, code: 0x45
      case Types.Primitive.LIST0:
        buffer = Buffer.alloc(0);
        break;
      // size: 2, code: 0x56
      case Types.Primitive.BOOLEAN:
        Parser.isBoolean(value);
        buffer = Buffer.alloc(1);
        buffer.writeUInt8(value ? Types.Primitive.TRUE : Types.Primitive.FALSE);
        break;
      // size: 2, code: 0x50
      case Types.Primitive.UBYTE:
      // size: 2, code: 0x51
      case Types.Primitive.SMALL_UINT:
      // size: 2, code: 0x52
      case Types.Primitive.SMALL_ULONG:
        Parser.isRange(value, 0, 255);
        buffer = Buffer.alloc(1);
        buffer.writeUInt8(value);
        break;
      // size: 3, code: 0x61
      case Types.Primitive.USHORT:
        Parser.isRange(value, 0, 65535);
        buffer = Buffer.alloc(2);
        buffer.writeUInt16BE(value);
        break;
      // size: 5, code: 0x71
      case Types.Primitive.UINT:
        Parser.isRange(value, 0, 4294967295);
        buffer = Buffer.alloc(4);
        buffer.writeUInt32BE(value);
        break;
      // size: 9, code: 0x81
      case Types.Primitive.ULONG: {
        const bigIntValue = Parser.getAsBigInt(value);
        if (bigIntValue < BigInt(0)) {
          throw new Crash(`Expected a positive number, got ${bigIntValue}`, {
            name: 'ProtocolError',
          });
        }
        buffer = Buffer.alloc(8);
        buffer.writeBigUInt64BE(bigIntValue);
        break;
      }
      // size: 5, code: 0x72
      case Types.Primitive.BYTE:
      // size: 2, code: 0x54
      case Types.Primitive.SMALL_INT:
      // size: 2, code: 0x55
      case Types.Primitive.SMALL_LONG:
        Parser.isRange(value, -128, 127);
        buffer = Buffer.alloc(1);
        buffer.writeInt8(value);
        break;
      // size: 3, code: 0x61
      case Types.Primitive.SHORT:
        Parser.isNumber(value);
        Parser.isRange(value, -32768, 32767);
        buffer = Buffer.alloc(2);
        buffer.writeInt16BE(value);
        break;
      // size: 5, code: 0x71
      case Types.Primitive.INT:
        Parser.isRange(value, -2147483648, 2147483647);
        buffer = Buffer.alloc(4);
        buffer.writeInt32BE(value);
        break;
      // size: 9, code: 0x81
      case Types.Primitive.LONG: {
        const bigintValue: bigint = Parser.getAsBigInt(value);
        buffer = Buffer.alloc(8);
        buffer.writeBigInt64BE(bigintValue);
        break;
      }
      // size: 5, code: 0x72
      case Types.Primitive.FLOAT:
        Parser.isFloat(value);
        buffer = Buffer.alloc(4);
        buffer.writeFloatBE(value);
        break;
      // size: 9, code: 0x82
      case Types.Primitive.DOUBLE:
        Parser.isFloat(value);
        buffer = Buffer.alloc(8);
        buffer.writeDoubleBE(value);
        break;
      // size: 5, code: 0x73
      case Types.Primitive.DECIMAL32:
      // size: 9, code: 0x83
      case Types.Primitive.DECIMAL64:
      // size: 17, code: 0x94
      case Types.Primitive.DECIMAL128:
        Parser.notImplemented(primitive);
      // size: 5, code: 0x73
      case Types.Primitive.CHAR:
        Parser.isString(value, 1);
        buffer = Buffer.alloc(4);
        buffer.writeUInt32BE(value.charCodeAt(0));
        break;
      // size: 5, code: 0x83
      case Types.Primitive.TIMESTAMP: {
        if (!(value instanceof Date)) {
          throw new Crash(`Expected a date, got ${typeof value}`, {
            name: 'ProtocolError',
          });
        }
        const _time = BigInt(value.getTime());
        buffer = Buffer.alloc(8);
        buffer.writeBigUInt64BE(_time);
        break;
      }
      // size: 17, code: 0x98
      case Types.Primitive.UUID:
        Parser.isString(value, 36);
        buffer = Buffer.from(parse(value));
        break;
      // size: 2 + value length, code: 0xa0
      case Types.Primitive.VBIN8:
        Parser.isBuffer(value, 2 ** 8 - 1);
        buffer = Buffer.alloc(1 + value.length);
        buffer.writeUInt8(value.length);
        value.copy(buffer, 1);
        break;
      // size: 5 + value.length, code: 0xb0
      case Types.Primitive.VBIN32:
        Parser.isBuffer(value, 2 ** 32 - 1);
        buffer = Buffer.alloc(4 + value.length);
        buffer.writeUInt32BE(value.length);
        value.copy(buffer, 4);
        break;
      // size: 2 + value.length, code: 0xa1
      case Types.Primitive.STR8:
        Parser.isString(value, 2 ** 8 - 1);
        buffer = Buffer.alloc(1 + value.length);
        buffer.writeUInt8(value.length);
        buffer.write(value, 1, 'utf-8');
        break;
      // size: 5 + value.length, code: 0xb1
      case Types.Primitive.STR32:
        Parser.isString(value, 2 ** 32 - 1);
        buffer = Buffer.alloc(4 + value.length);
        buffer.writeUInt32BE(value.length);
        buffer.write(value, 4, 'utf-8');
        break;
      // size: 2 + value.length, code: 0xa3
      case Types.Primitive.SYM8:
        Parser.isString(value, 2 ** 8 - 1);
        buffer = Buffer.alloc(1 + value.length);
        buffer.writeUInt8(value.length);
        buffer.write(value, 1, 'ascii');
        break;
      // size: 5 + value.length, code: 0xb3
      case Types.Primitive.SYM32:
        Parser.isString(value, 2 ** 32 - 1);
        buffer = Buffer.alloc(4 + value.length);
        buffer.writeUInt32BE(value.length);
        buffer.write(value, 4, 'ascii');
        break;
      // size: 2 + value.length, code: 0xc0
      default:
        throw new Crash(
          `Not parsable code [0x${primitive.toString(16)}]/[${Types.Primitive[primitive]}], parsing failed.`,
          { name: 'ProtocolError' }
        );
    }
    return buffer;
  }
  /**
   * Throws a crash error for a not implemented primitive
   * @param primitive - The primitive that is not implemented
   * @throws Crash - The crash error
   */
  private static notImplemented(primitive: Types.Primitive): never {
    throw new Crash(`Decoder for ${Types.Primitive[primitive]} is not implemented`, {
      name: 'NotImplemented',
    });
  }
  /**
   * Checks if the value is a number
   * @param value - value to be checked
   * @throws Crash - if the value is not a number
   */
  private static isNumber(value: unknown): asserts value is number {
    if (typeof value !== 'number') {
      throw new Crash(`Expected a number, got ${typeof value}`, {
        name: 'ProtocolError',
      });
    }
  }
  /**
   * Checks if the value is within the given range
   * @param value - value to be checked
   * @param min - minimum value
   * @param max - maximum value
   * @throws Crash - if the value is not within the given range
   */
  private static isRange(value: unknown, min: number, max: number): asserts value is number {
    Parser.isNumber(value);
    if (value < min || value > max) {
      throw new Crash(`Expected a number between ${min} and ${max}, got ${value}`, {
        name: 'ProtocolError',
      });
    }
  }
  /**
   * Checks if the value is a float number
   * @param value - value to be checked
   * @throws Crash - if the value is not a float number
   */
  private static isFloat(value: unknown): asserts value is number {
    Parser.isNumber(value);
    if (!Number.isFinite(value) || Number.isInteger(value)) {
      throw new Crash(`Expected a float number, got ${typeof value}`, {
        name: 'ProtocolError',
      });
    }
  }
  /**
   * Return the value as a bigint
   * @param value - value to be converted
   * @throws Crash - if the value is not a number or bigint
   */
  private static getAsBigInt(value: unknown): bigint {
    if (typeof value === 'bigint') {
      return value;
    } else if (value instanceof BigInt) {
      return value.valueOf();
    } else if (typeof value === 'number') {
      return BigInt(value);
    } else {
      throw new Crash(`Expected a number or bigint, got ${typeof value}`, {
        name: 'ProtocolError',
      });
    }
  }
  /**
   * Checks if the value is a string
   * @param value - value to be checked
   * @param maxSize - maximum size of the string
   * @throws Crash - if the value is not a string
   */
  private static isString(value: unknown, maxSize: number): asserts value is string {
    if (typeof value !== 'string') {
      throw new Crash(`Expected a string, got ${typeof value}`, {
        name: 'ProtocolError',
      });
    }
    if (maxSize !== undefined && value.length > maxSize) {
      throw new Crash(
        `Expected a string with a maximum length of ${maxSize}, got ${value.length}`,
        { name: 'ProtocolError' }
      );
    }
  }
  /**
   * Checks if the value is a boolean
   * @param value - value to be checked
   * @throws Crash - if the value is not a boolean
   */
  private static isBoolean(value: unknown): asserts value is boolean {
    if (typeof value !== 'boolean') {
      throw new Crash(`Expected a boolean, got ${typeof value}`, {
        name: 'ProtocolError',
      });
    }
  }
  /**
   * Checks if the value is a buffer
   * @param value - value to be checked
   * @param maxSize - maximum size of the buffer
   * @throws Crash - if the value is not a buffer
   */
  private static isBuffer(value: unknown, maxSize: number): asserts value is Buffer {
    if (!Buffer.isBuffer(value)) {
      throw new Crash(`Expected a buffer, got ${typeof value}`, {
        name: 'ProtocolError',
      });
    }
    if (maxSize !== undefined && value.length > maxSize) {
      throw new Crash(
        `Expected a buffer with a maximum length of ${maxSize}, got ${value.length}`,
        { name: 'ProtocolError' }
      );
    }
  }
}
