/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { parse } from 'uuid';
import { DecodedType, PrimitiveType } from '..';
/** Serializer for AMQP elements */
export class Serializer {
  /**
   * Serializes the given value
   * @param value The value to serialize
   * @returns The serialized value
   */
  public static serialize<T extends PrimitiveType>(element: DecodedType<T>): Buffer {
    let buffer = Buffer.alloc(element.size);
    buffer.writeUInt8(element.type, 0);
    switch (element.type) {
      // size: 1, code: 0x41
      case PrimitiveType.TRUE:
      // size: 1, code: 0x42
      case PrimitiveType.FALSE:
      // size: 1, code: 0x40
      case PrimitiveType.NULL:
      // size: 1, code: 0x43
      case PrimitiveType.UNIT0:
      // size: 1, code: 0x44
      case PrimitiveType.ULONG0:
      // size: 1, code: 0x45
      case PrimitiveType.LIST0:
        break;
      // size: 2, code: 0x56
      case PrimitiveType.BOOLEAN:
        buffer.writeUInt8((element.value as boolean) ? PrimitiveType.TRUE : PrimitiveType.FALSE, 1);
        break;
      // size: 2, code: 0x50
      case PrimitiveType.UBYTE:
      // size: 2, code: 0x51
      case PrimitiveType.SMALL_UINT:
      // size: 2, code: 0x52
      case PrimitiveType.SMALL_ULONG:
        buffer.writeUInt8(element.value as number, 1);
        break;
      // size: 3, code: 0x61
      case PrimitiveType.USHORT:
        buffer.writeUInt16BE(element.value as number, 1);
        break;
      // size: 5, code: 0x71
      case PrimitiveType.UINT:
        buffer.writeUInt32BE(element.value as number, 1);
        break;
      // size: 9, code: 0x81
      case PrimitiveType.ULONG:
        buffer.writeBigUInt64BE(BigInt(element.value as number), 1);
        break;
      // size: 5, code: 0x72
      case PrimitiveType.BYTE:
      // size: 2, code: 0x54
      case PrimitiveType.SMALL_INT:
      // size: 2, code: 0x55
      case PrimitiveType.SMALL_LONG:
        buffer.writeInt8(element.value as number, 1);
        break;
      // size: 3, code: 0x61
      case PrimitiveType.SHORT:
        buffer.writeInt16BE(element.value as number, 1);
        break;
      // size: 5, code: 0x71
      case PrimitiveType.INT:
        buffer.writeInt32BE(element.value as number, 1);
        break;
      // size: 9, code: 0x81
      case PrimitiveType.LONG:
        buffer.writeBigInt64BE(BigInt(element.value as number), 1);
        break;
      // size: 5, code: 0x72
      case PrimitiveType.FLOAT:
        buffer.writeFloatBE(element.value as number, 1);
        break;
      // size: 9, code: 0x82
      case PrimitiveType.DOUBLE:
        buffer.writeDoubleBE(element.value as number, 1);
        break;
      // size: 5, code: 0x73
      case PrimitiveType.DECIMAL32:
      // size: 9, code: 0x83
      case PrimitiveType.DECIMAL64:
      // size: 17, code: 0x94
      case PrimitiveType.DECIMAL128:
        Serializer.notImplemented(element.type);
      // size: 5, code: 0x73
      case PrimitiveType.CHAR:
        buffer.writeUInt32BE(element.value as number, 1);
        break;
      // size: 5, code: 0x83
      case PrimitiveType.TIMESTAMP:
        buffer.writeBigUInt64BE(BigInt((element.value as Date).getTime()), 1);
        break;
      // size: 17, code: 0x98
      case PrimitiveType.UUID:
        const uuid = Buffer.from(parse(element.value as string));
        uuid.copy(buffer, 1);
        break;
      // size: 2 + value length, code: 0xa0
      case PrimitiveType.VBIN8:
        buffer.writeUInt8((element.value as Buffer).length, 1);
        (element.value as Buffer).copy(buffer, 2);
        break;
      // size: 5 + value.length, code: 0xb0
      case PrimitiveType.VBIN32:
        buffer.writeUInt32BE((element.value as Buffer).length, 1);
        (element.value as Buffer).copy(buffer, 5);
        break;
      // size: 2 + value.length, code: 0xa1
      case PrimitiveType.STR8:
        buffer.writeUInt8((element.value as string).length, 1);
        buffer.write(element.value as string, 2, 'utf-8');
        break;
      // size: 5 + value.length, code: 0xb1
      case PrimitiveType.STR32:
        buffer.writeUInt32BE((element.value as string).length, 1);
        buffer.write(element.value as string, 5, 'utf-8');
        break;
      // size: 2 + value.length, code: 0xa3
      case PrimitiveType.SYM8:
        buffer.writeUInt8((element.value as string).length, 1);
        buffer.write(element.value as string, 2, 'ascii');
        break;
      // size: 5 + value.length, code: 0xb3
      case PrimitiveType.SYM32:
        buffer.writeUInt32BE((element.value as string).length, 1);
        buffer.write(element.value as string, 5, 'ascii');
        break;
      // size: 2 + value.length, code: 0xc0
      case PrimitiveType.LIST8:
      // size: 5 + value.length, code: 0xd0
      case PrimitiveType.LIST32:
        break;
      // size: 2 + value.length, code: 0xc1
      case PrimitiveType.MAP8:
      // size: 5 + value.length, code: 0xd1
      case PrimitiveType.MAP32:
        break;
      // size: 2 + value.length, code: 0xe0
      case PrimitiveType.ARRAY8:
      // size: 5 + value.length, code: 0xf0
      case PrimitiveType.ARRAY32:
        break;
      default:
        //@ts-expect-error - Its supposed to be unreachable, but to be safe we throw an error
        throw new Crash(`Unknown code ${code.toString(16)}[${PrimitiveType[code]}]`);
    }
    return buffer;
  }
  /**
   * Throws an error if the decoder is not implemented
   * @param options - The options for the decoder
   * @returns never
   * @throws Crash
   */
  private static notImplemented(primitive: PrimitiveType): never {
    throw new Crash(`Decoder for ${PrimitiveType[primitive]} is not implemented`, {
      name: 'NotImplemented',
    });
  }
}
