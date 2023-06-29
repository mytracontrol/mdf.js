/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { InvalidAsn1Error } from '../errors';
import { Ber } from '../types';
import { checkExpectedTag, validateTag } from '../utils/utils';

export class Reader {
  /** The buffer to read from */
  private _buf: Buffer;
  /** The size of the entire buffer */
  private _size: number;
  /** The length of the current sequence being read */
  private _len: number;
  /** The current offset into the buffer */
  private _offset: number;

  /**
   * Creates an instance of Reader for the given buffer.
   * @param data - the buffer to read from.
   */
  constructor(data: Buffer) {
    this._buf = data;
    this._size = data.length;
    this._len = 0;
    this._offset = 0;

    if (!data || !Buffer.isBuffer(data)) {
      throw new TypeError('Cannot parse byte stream, data is empty');
    }
  }

  /** Gets the current length of the sequence being read */
  public get length(): number {
    return this._len;
  }
  /** Gets the current offset into the buffer */
  public get offset(): number {
    return this._offset;
  }
  /** Gets the number of bytes remaining to be read in the buffer */
  public get remain(): number {
    return this._size - this._offset;
  }
  /** Gets the underlying buffer */
  public get buffer(): Buffer {
    return this._buf.subarray(this._offset);
  }

  /**
   * Reads a single byte and advances offset; you can pass in `true` to make this
   * a "peek" operation (i.e., get the byte, but don't advance the offset).
   * @param peek - true means don't move offset.
   * @returns the read byte, null if not enough data.
   */
  public readByte(peek = false): number | null {
    if (this.remain < 1) {
      return null;
    }

    const b = this._buf[this._offset] & 0xff;
    if (!peek) {
      this._offset++;
    }

    return b;
  }

  /**
   * Reads a single byte without advancing offset.
   * @returns the read byte, null if not enough data.
   */
  public peek(): number | null {
    return this.readByte(true);
  }

  /**
   * Reads a (potentially) variable length off the BER buffer. This call is
   * not really meant to be called directly, as callers have to manipulate
   * the internal buffer afterwards.
   * As a result of this call, you can call `Reader.length`, until the
   * next thing called that does a readLength.
   * @returns the amount of offset to advance the buffer.
   * @throws InvalidAsn1Error when length read is not valid.
   */
  public readLength(offset: number): number | null {
    if (offset === undefined) {
      offset = this._offset;
    }

    if (offset >= this._size) {
      return null;
    }

    // Get byte at offset and check it to be a positive integer
    let lenB = this._buf[offset++] & 0xff;
    if (lenB === null) {
      return null;
    }

    // Most significant bit is set (bit 7 is 1), variable length encoding
    if ((lenB & 0x80) === 0x80) {
      lenB &= 0x7f; // Actual length

      if (lenB === 0) {
        throw new InvalidAsn1Error('Indefinite length not supported');
      }

      // Caused problems for node-net-snmp issue #172
      // if (lenB > 4) {
      //   throw new InvalidAsn1Error('encoding length too long');
      // }

      if (this._size - offset < lenB) {
        return null;
      }

      this._len = 0;
      for (let i = 0; i < lenB; i++) {
        this._len *= 256;
        this._len += this._buf[offset++] & 0xff;
      }
    } else {
      this._len = lenB;
    }

    return offset;
  }

  /**
   * Parses the next sequence in this BER buffer.
   * To get the length of the sequence, call `Reader.length`.
   * @returns the sequence's tag.
   * @throws InvalidAsn1Error when tag is not valid
   */
  public readSequence(tag?: number): number | null {
    const seq = this.peek();
    if (seq === null) {
      return null;
    }

    if (tag !== undefined && tag !== seq) {
      throw new InvalidAsn1Error(`Expected 0x${tag.toString(16)}: got 0x${seq.toString(16)}`);
    }

    const readLen = this.readLength(this._offset + 1); // stored in `length`
    if (readLen === null) {
      return null;
    }

    this._offset = readLen;
    return seq;
  }

  /**
   * Reads and integer from the buffer.
   * @param tag - the tag to check for integer-ness.
   * @returns the integer, null if not enough data.
   */
  public readInt(tag?: number): number | null {
    tag = validateTag(tag, Ber.Integer);
    return this._readTag(tag);
  }

  /**
   * Reads a boolean value from the buffer.
   * @param tag - the tag to check for boolean-ness.
   * @returns the boolean
   */
  public readBoolean(tag?: number): boolean {
    tag = validateTag(tag, Ber.Boolean);
    return this._readTag(tag) === 0 ? false : true;
  }

  /**
   * Reads an octet string from the buffer.
   * @param tag - the tag to check for octet string-ness.
   * @returns the string, null if not enough data.
   */
  public readEnumeration(tag?: number): number | null {
    tag = validateTag(tag, Ber.Enumeration);
    return this._readTag(tag);
  }

  /**
   * Reads an string from the buffer.
   * @param tag - the tag to check for string-ness.
   * @param retbuf - wether to return a buffer instead of a string.
   * @returns the string or buffer, null if not enough data.
   * @throws InvalidAsn1Error when tag is not valid.
   */
  public readString(tag?: number, retbuf?: boolean): string | Buffer | null {
    // TODO: DONE: Check type, it also prevents undefined
    tag = validateTag(tag, Ber.OctetString);

    const byte = this.peek();
    if (byte === null) {
      return null;
    }

    checkExpectedTag(tag, byte);

    const offsetAfterLength = this.readLength(this._offset + 1); // stored in `length`
    if (offsetAfterLength === null) {
      return null;
    }

    if (this._len > this._size - offsetAfterLength) {
      return null;
    }

    this._offset = offsetAfterLength;

    if (this._len === 0) {
      return retbuf ? Buffer.alloc(0) : '';
    }

    const str = this._buf.subarray(this._offset, this._offset + this._len);
    this._offset += this._len;
    return retbuf ? str : str.toString('utf8');
  }

  /**
   * Reads an object identifier from the buffer.
   * @param tag - the tag to check for object identifier-ness.
   * @returns - the OID string, null if not enough data.
   * @throws InvalidAsn1Error when tag is not valid.
   */
  public readOID(tag?: number): string | null {
    tag = validateTag(tag, Ber.OID);

    const strBuffer = this.readString(tag, true);
    if (strBuffer === null) {
      return null;
    }

    const values: number[] = [];
    let value = 0;

    for (let i = 0; i < strBuffer.length; i++) {
      const byte = (strBuffer as Buffer)[i] & 0xff;
      value <<= 7;
      value += byte & 0x7f;
      if ((byte & 0x80) == 0) {
        values.push(value >>> 0);
        value = 0;
      }
    }

    value = values.shift() as number;
    values.unshift(value % 40);
    values.unshift((value / 40) >> 0);

    return values.join('.');
  }

  /**
   * Reads a bit string from the buffer.
   * @param tag - the tag to check for bit string-ness.
   * @returns the bit string, null if not enough data.
   * @throws InvalidAsn1Error when tag is not valid.
   */
  public readBitString(tag?: number): string | null {
    tag = validateTag(tag, Ber.BitString);

    const byte = this.peek();
    if (byte === null) {
      return null;
    }

    checkExpectedTag(tag, byte);

    const offsetAfterLength = this.readLength(this._offset + 1); // stored in `length`
    if (offsetAfterLength === null) {
      return null;
    }

    if (this._len > this._size - offsetAfterLength) {
      return null;
    }

    this._offset = offsetAfterLength;

    if (this._len === 0) {
      return '';
    }

    const ignoredBits = this._buf[this._offset++];
    const bitStringOctets = this._buf.subarray(this._offset, this._offset + this._len - 1);
    const bitString = parseInt(bitStringOctets.toString('hex'), 16)
      .toString(2)
      .padStart(bitStringOctets.length * 8, '0');
    this._offset += this._len - 1;

    return bitString.substring(0, bitString.length - ignoredBits);
  }

  /**
   * Reads a value based on the type provided as tag.
   * @param tag - the tag representing type of value to read.
   * @returns the value, null if not enough data.
   * @throws InvalidAsn1Error when tag is not valid.
   */
  private _readTag(tag: number): number | null {
    const byte = this.peek();

    if (byte === null) {
      return null;
    }

    checkExpectedTag(tag, byte);

    const offsetAfterLength = this.readLength(this._offset + 1); // stored in `length`
    if (offsetAfterLength === null) {
      return null;
    }

    if (this._len === 0) {
      throw new InvalidAsn1Error('Zero-length integer');
    }

    if (this._len > this._size - offsetAfterLength) {
      return null;
    }

    this._offset = offsetAfterLength;

    let value = this._buf.readInt8(this._offset++);
    for (let i = 1; i < this._len; i++) {
      value *= 256;
      value += this._buf[this._offset++];
    }

    if (!Number.isSafeInteger(value)) {
      throw new InvalidAsn1Error('Integer not representable as javascript number');
    }

    return value;
  }
}
