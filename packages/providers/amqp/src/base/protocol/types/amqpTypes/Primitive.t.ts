/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Represents the primitive types */
export enum Primitive {
  /** Indicates a descriptor value */
  DESCRIPTOR = 0x00,
  /** Indicates a empty value */
  NULL = 0x40,
  /** Indicates a boolean value */
  BOOLEAN = 0x56,
  /** Indicates a `true` value */
  TRUE = 0x41,
  /** Indicates a `false` value */
  FALSE = 0x42,
  /** Unsigned integer in the range of 0 to 2^8 - 1 inclusive [0, 255] */
  UBYTE = 0x50,
  /** Unsigned integer in the range of 0 to 2^16 - 1 inclusive [0, 65535] */
  USHORT = 0x60,
  /** Unsigned integer in the range of 0 to 2^32 - 1 inclusive [0, 4294967295] */
  UINT = 0x70,
  /** Unsigned integer in the range of 0 to 255 inclusive */
  SMALL_UINT = 0x52,
  /** Unsigned integer value 0 */
  UNIT0 = 0x43,
  /** Unsigned integer in the range of 0 to 2^64 - 1 inclusive [0, 18446744073709551615] */
  ULONG = 0x80,
  /** Unsigned integer in the range of 0 to 2^8 - 1 inclusive [0, 255] */
  SMALL_ULONG = 0x53,
  /** The ULONG value 0 */
  ULONG0 = 0x44,
  /** Signed integer in the range of -2^7 to 2^7 - 1 inclusive [-128, 127] */
  BYTE = 0x51,
  /** Signed integer in the range of -2^15 to 2^15 - 1 inclusive [-32768, 32767] */
  SHORT = 0x61,
  /** Signed integer in the range of -2^31 to 2^31 - 1 inclusive [-2147483648, 2147483647] */
  INT = 0x71,
  /** Signed integer in the range of -128 to 127 inclusive */
  SMALL_INT = 0x54,
  /** Signed integer in the range of -2^63 to 2^63 - 1 inclusive [-9223372036854775808, 9223372036854775807] */
  LONG = 0x81,
  /** Signed integer in the range of -128 to 127 inclusive */
  SMALL_LONG = 0x55,
  /** Floating point number in IEEE 754 single precision format (32-bit) */
  FLOAT = 0x72,
  /** Floating point number in IEEE 754 double precision format (64-bit) */
  DOUBLE = 0x82,
  /** IEEE 754 decimal32 using the Binary Integer Decimal encoding (32-bit) */
  DECIMAL32 = 0x74,
  /** IEEE 754 decimal64 using the Binary Integer Decimal encoding (64-bit) */
  DECIMAL64 = 0x84,
  /** IEEE 754 decimal128 using the Binary Integer Decimal encoding (128-bit) */
  DECIMAL128 = 0x94,
  /** UTF-32BE encoded Unicode character */
  CHAR = 0x73,
  /** 64-bit timestamp representing the number of milliseconds since the Unix epoch */
  TIMESTAMP = 0x83,
  /** UUID as defined by RFC-4122 */
  UUID = 0x98,
  /** Up to 2^8 - 1 octets of binary data */
  VBIN8 = 0xa0,
  /** Up to 2^32 - 1 octets of binary data */
  VBIN32 = 0xb0,
  /** Up to 2^8 - 1 octets of UTF-8 encoded Unicode characters (with no byte order mark) */
  STR8 = 0xa1,
  /** Up to 2^32 - 1 octets of UTF-8 encoded Unicode characters (with no byte order mark) */
  STR32 = 0xb1,
  /** Up to 2^8 - 1 seven bit ASCII characters representing a symbolic value */
  SYM8 = 0xa3,
  /** Up to 2^32 - 1 seven bit ASCII characters representing a symbolic value */
  SYM32 = 0xb3,
  /** Empty list */
  LIST0 = 0x45,
  /** List with up to 2^8 - 1 elements with total size less than 2^8 octets */
  LIST8 = 0xc0,
  /** List with up to 2^32 - 1 elements with total size less than 2^32 octets */
  LIST32 = 0xd0,
  /** Up to 2^8 - 1 octets of encoded map data */
  MAP8 = 0xc1,
  /** Up to 2^32 - 1 octets of encoded map data */
  MAP32 = 0xd1,
  /** Up to 2^8 - 1 array elements with total size less than 2^8 octets */
  ARRAY8 = 0xe0,
  /** Up to 2^32 - 1 array elements with total size less than 2^32 octets */
  ARRAY32 = 0xf0,
}

export type Descriptor = Primitive.DESCRIPTOR;

/** Fixed width primitives */
export type FixedWidth =
  | Primitive.NULL
  | Primitive.BOOLEAN
  | Primitive.TRUE
  | Primitive.FALSE
  | Primitive.UBYTE
  | Primitive.USHORT
  | Primitive.UINT
  | Primitive.SMALL_UINT
  | Primitive.UNIT0
  | Primitive.ULONG
  | Primitive.SMALL_ULONG
  | Primitive.ULONG0
  | Primitive.BYTE
  | Primitive.SHORT
  | Primitive.INT
  | Primitive.SMALL_INT
  | Primitive.LONG
  | Primitive.SMALL_LONG
  | Primitive.FLOAT
  | Primitive.DOUBLE
  | Primitive.DECIMAL32
  | Primitive.DECIMAL64
  | Primitive.DECIMAL128
  | Primitive.CHAR
  | Primitive.TIMESTAMP
  | Primitive.UUID;
/** Variable width primitives */
export type VariableWidth =
  | Primitive.VBIN8
  | Primitive.VBIN32
  | Primitive.STR8
  | Primitive.STR32
  | Primitive.SYM8
  | Primitive.SYM32;
/** Compound primitives */
export type Compound = Primitive.LIST8 | Primitive.LIST32 | Primitive.MAP8 | Primitive.MAP32;
/** Array primitives */
export type Array = Primitive.ARRAY8 | Primitive.ARRAY32;

/** Represents a primitive based value */
export type PrimitiveBasedValue<T extends Primitive> = {
  [Primitive.DESCRIPTOR]: object;
  [Primitive.NULL]: null;
  [Primitive.BOOLEAN]: boolean;
  [Primitive.TRUE]: true;
  [Primitive.FALSE]: false;
  [Primitive.UBYTE]: number;
  [Primitive.USHORT]: number;
  [Primitive.UINT]: number;
  [Primitive.SMALL_UINT]: number;
  [Primitive.UNIT0]: 0;
  [Primitive.ULONG]: bigint;
  [Primitive.SMALL_ULONG]: number;
  [Primitive.ULONG0]: 0;
  [Primitive.BYTE]: number;
  [Primitive.SHORT]: number;
  [Primitive.INT]: number;
  [Primitive.SMALL_INT]: number;
  [Primitive.LONG]: bigint;
  [Primitive.SMALL_LONG]: number;
  [Primitive.FLOAT]: number;
  [Primitive.DOUBLE]: number;
  [Primitive.DECIMAL32]: number;
  [Primitive.DECIMAL64]: number;
  [Primitive.DECIMAL128]: number;
  [Primitive.CHAR]: string;
  [Primitive.TIMESTAMP]: Date;
  [Primitive.UUID]: string;
  [Primitive.VBIN8]: Buffer;
  [Primitive.VBIN32]: Buffer;
  [Primitive.STR8]: string;
  [Primitive.STR32]: string;
  [Primitive.SYM8]: string;
  [Primitive.SYM32]: string;
  [Primitive.LIST0]: [];
  [Primitive.LIST8]: unknown[];
  [Primitive.LIST32]: unknown[];
  [Primitive.MAP8]: Record<string, unknown>;
  [Primitive.MAP32]: Record<string, unknown>;
  [Primitive.ARRAY8]: unknown[];
  [Primitive.ARRAY32]: unknown[];
}[T];
