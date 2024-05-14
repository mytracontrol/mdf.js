/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { parse } from 'uuid';
import { Element, Primitives } from '..';
/** Serializer for AMQP elements */
export class Serializer {
  /**
   * Serializes the given value
   * @param value The value to serialize
   * @returns The serialized value
   */
  public static serialize<T extends Primitives>(element: Element<T>): Buffer {
    let buffer = Buffer.alloc(element.size);
    buffer.writeUInt8(element.primitive, 0);
    switch (element.primitive) {
      // size: 1, code: 0x41
      case Primitives.TRUE:
      // size: 1, code: 0x42
      case Primitives.FALSE:
      // size: 1, code: 0x40
      case Primitives.NULL:
      // size: 1, code: 0x43
      case Primitives.UNIT0:
      // size: 1, code: 0x44
      case Primitives.ULONG0:
      // size: 1, code: 0x45
      case Primitives.LIST0:
        break;
      // size: 2, code: 0x56
      case Primitives.BOOLEAN:
        buffer.writeUInt8((element.value as boolean) ? Primitives.TRUE : Primitives.FALSE, 1);
        break;
      // size: 2, code: 0x50
      case Primitives.UBYTE:
      // size: 2, code: 0x51
      case Primitives.SMALL_UINT:
      // size: 2, code: 0x52
      case Primitives.SMALL_ULONG:
        buffer.writeUInt8(element.value as number, 1);
        break;
      // size: 3, code: 0x61
      case Primitives.USHORT:
        buffer.writeUInt16BE(element.value as number, 1);
        break;
      // size: 5, code: 0x71
      case Primitives.UINT:
        buffer.writeUInt32BE(element.value as number, 1);
        break;
      // size: 9, code: 0x81
      case Primitives.ULONG:
        buffer.writeBigUInt64BE(BigInt(element.value as number), 1);
        break;
      // size: 5, code: 0x72
      case Primitives.BYTE:
      // size: 2, code: 0x54
      case Primitives.SMALL_INT:
      // size: 2, code: 0x55
      case Primitives.SMALL_LONG:
        buffer.writeInt8(element.value as number, 1);
        break;
      // size: 3, code: 0x61
      case Primitives.SHORT:
        buffer.writeInt16BE(element.value as number, 1);
        break;
      // size: 5, code: 0x71
      case Primitives.INT:
        buffer.writeInt32BE(element.value as number, 1);
        break;
      // size: 9, code: 0x81
      case Primitives.LONG:
        buffer.writeBigInt64BE(BigInt(element.value as number), 1);
        break;
      // size: 5, code: 0x72
      case Primitives.FLOAT:
        buffer.writeFloatBE(element.value as number, 1);
        break;
      // size: 9, code: 0x82
      case Primitives.DOUBLE:
        buffer.writeDoubleBE(element.value as number, 1);
        break;
      // size: 5, code: 0x73
      case Primitives.DECIMAL32:
      // size: 9, code: 0x83
      case Primitives.DECIMAL64:
      // size: 17, code: 0x94
      case Primitives.DECIMAL128:
        Serializer.notImplemented(element.primitive);
      // size: 5, code: 0x73
      case Primitives.CHAR:
        buffer.writeUInt32BE(element.value as number, 1);
        break;
      // size: 5, code: 0x83
      case Primitives.TIMESTAMP:
        buffer.writeBigUInt64BE(BigInt((element.value as Date).getTime()), 1);
        break;
      // size: 17, code: 0x98
      case Primitives.UUID:
        const uuid = Buffer.from(parse(element.value as string));
        uuid.copy(buffer, 1);
        break;
      // size: 2 + value length, code: 0xa0
      case Primitives.VBIN8:
        buffer.writeUInt8((element.value as Buffer).length, 1);
        (element.value as Buffer).copy(buffer, 2);
        break;
      // size: 5 + value.length, code: 0xb0
      case Primitives.VBIN32:
        buffer.writeUInt32BE((element.value as Buffer).length, 1);
        (element.value as Buffer).copy(buffer, 5);
        break;
      // size: 2 + value.length, code: 0xa1
      case Primitives.STR8:
        buffer.writeUInt8((element.value as string).length, 1);
        buffer.write(element.value as string, 2, 'utf-8');
        break;
      // size: 5 + value.length, code: 0xb1
      case Primitives.STR32:
        buffer.writeUInt32BE((element.value as string).length, 1);
        buffer.write(element.value as string, 5, 'utf-8');
        break;
      // size: 2 + value.length, code: 0xa3
      case Primitives.SYM8:
        buffer.writeUInt8((element.value as string).length, 1);
        buffer.write(element.value as string, 2, 'ascii');
        break;
      // size: 5 + value.length, code: 0xb3
      case Primitives.SYM32:
        buffer.writeUInt32BE((element.value as string).length, 1);
        buffer.write(element.value as string, 5, 'ascii');
        break;
      // size: 2 + value.length, code: 0xc0
      case Primitives.LIST8:
      // size: 5 + value.length, code: 0xd0
      case Primitives.LIST32:
        break;
      // size: 2 + value.length, code: 0xc1
      case Primitives.MAP8:
      // size: 5 + value.length, code: 0xd1
      case Primitives.MAP32:
        break;
      // size: 2 + value.length, code: 0xe0
      case Primitives.ARRAY8:
      // size: 5 + value.length, code: 0xf0
      case Primitives.ARRAY32:
        break;
      default:
        //@ts-expect-error - Its supposed to be unreachable, but to be safe we throw an error
        throw new Crash(`Unknown code ${code.toString(16)}[${Primitives[code]}]`);
    }
    return buffer;
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
