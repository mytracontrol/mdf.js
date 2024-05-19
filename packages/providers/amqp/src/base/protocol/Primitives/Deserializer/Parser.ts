/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { stringify } from 'uuid';
import { Types } from '../..';

export class Parser {
  /**
   * Parse a buffer into a primitive value.
   * @param data The buffer to parse.
   * @param primitive The primitive type to parse.
   * @returns The parsed value.
   */
  public static parse<P extends Types.Primitive>(
    data: Buffer,
    primitive: P
  ): Types.PrimitiveBasedValue<P> {
    switch (primitive) {
      case Types.Primitive.NULL:
        return null as Types.PrimitiveBasedValue<P>;
      case Types.Primitive.BOOLEAN:
        return (data.readUInt8() === 0x41) as Types.PrimitiveBasedValue<P>;
      case Types.Primitive.TRUE:
        return true as Types.PrimitiveBasedValue<P>;
      case Types.Primitive.FALSE:
        return false as Types.PrimitiveBasedValue<P>;
      case Types.Primitive.UBYTE:
      case Types.Primitive.SMALL_UINT:
      case Types.Primitive.SMALL_ULONG:
        return data.readUInt8() as Types.PrimitiveBasedValue<P>;
      case Types.Primitive.USHORT:
        return data.readUInt16BE() as Types.PrimitiveBasedValue<P>;
      case Types.Primitive.UINT:
        return data.readUInt32BE() as Types.PrimitiveBasedValue<P>;
      case Types.Primitive.ULONG:
        return data.readBigUInt64BE() as Types.PrimitiveBasedValue<P>;
      case Types.Primitive.UNIT0:
      case Types.Primitive.ULONG0:
        return 0 as Types.PrimitiveBasedValue<P>;
      case Types.Primitive.BYTE:
      case Types.Primitive.SMALL_INT:
      case Types.Primitive.SMALL_LONG:
        return data.readInt8() as Types.PrimitiveBasedValue<P>;
      case Types.Primitive.SHORT:
        return data.readInt16BE() as Types.PrimitiveBasedValue<P>;
      case Types.Primitive.INT:
        return data.readInt32BE() as Types.PrimitiveBasedValue<P>;
      case Types.Primitive.LONG:
        return data.readBigInt64BE() as Types.PrimitiveBasedValue<P>;
      case Types.Primitive.FLOAT:
        return data.readFloatBE() as Types.PrimitiveBasedValue<P>;
      case Types.Primitive.DOUBLE:
        return data.readDoubleBE() as Types.PrimitiveBasedValue<P>;
      case Types.Primitive.DECIMAL32:
      case Types.Primitive.DECIMAL64:
      case Types.Primitive.DECIMAL128:
        throw new Crash('Decimal types are not supported yet.', { name: 'NotImplementedError' });
      case Types.Primitive.CHAR:
        return String.fromCharCode(data.readUInt32BE()) as Types.PrimitiveBasedValue<P>;
      case Types.Primitive.TIMESTAMP:
        return new Date(Number(data.readBigInt64BE())) as Types.PrimitiveBasedValue<P>;
      case Types.Primitive.UUID:
        return stringify(data) as Types.PrimitiveBasedValue<P>;
      case Types.Primitive.VBIN8:
      case Types.Primitive.VBIN32:
        return data as Types.PrimitiveBasedValue<P>;
      case Types.Primitive.STR8:
      case Types.Primitive.STR32:
        return data.toString('utf-8') as Types.PrimitiveBasedValue<P>;
      case Types.Primitive.SYM8:
      case Types.Primitive.SYM32:
        return data.toString('ascii') as Types.PrimitiveBasedValue<P>;
      case Types.Primitive.LIST0:
        return [] as Types.PrimitiveBasedValue<P>;
      default:
        throw new Crash(
          `Not parsable code [0x${primitive.toString(16)}]/[${Types.Primitive[primitive]}], parsing failed.`,
          { name: 'ProtocolError' }
        );
    }
  }
}
