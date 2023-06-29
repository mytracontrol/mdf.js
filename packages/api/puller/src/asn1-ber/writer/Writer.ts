import assert from 'assert';
import { defaults } from 'lodash';
import { DEFAULT_WRITER_OPTIONS, WriterOptions } from '.';
import { InvalidAsn1Error } from '../errors';
import { Ber } from '../types';
import { checkDataType, validateTag } from '../utils/utils';

export class Writer {
  /** The buffer to write to */
  private _buf: Buffer;
  /** The size of the entire buffer */
  private _size: number;
  /** The current offset into the buffer */
  private _offset: number;
  /** The current sequence being written */
  private _seq: number[];
  /** The options for the writer */
  private _options: WriterOptions;

  /**
   * Creates an instance of the Writer class.
   * @param options - The options for the writer.
   */
  constructor(options?: WriterOptions) {
    options = defaults(options, DEFAULT_WRITER_OPTIONS);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this._buf = Buffer.alloc(options.size!);
    this._size = this._buf.length;
    this._offset = 0;
    this._seq = [];
    this._options = options;
  }

  /**
   * Gets the current buffer containing the written data.
   * @throws InvalidAsn1Error when there are unended sequences.
   */
  public get buffer(): Buffer {
    if (this._seq.length) {
      throw new InvalidAsn1Error(`${this._seq.length} unended sequence(s)`);
    }
    return this._buf.subarray(0, this._offset);
  }

  /**
   * Writes a byte to the buffer
   * @param byte - The byte to write
   */
  public writeByte(byte: number): void {
    checkDataType(byte, 'number', 'argument must be a Number');

    this._ensure(1);
    this._buf[this._offset++] = byte;
  }

  /**
   * Writes a signed or unsigned integer to the buffer
   * @param integer - The integer to write
   * @param tag - The tag to write
   */
  public writeInt(integer: number, tag?: number): void {
    checkDataType(integer, 'integer', 'argument must be an Integer');
    tag = validateTag(tag, Ber.Integer);

    const bytes: number[] = [];
    while (integer < -0x80 || integer >= 0x80) {
      bytes.push(integer & 0xff);
      integer = Math.floor(integer / 0x100);
    }
    bytes.push(integer & 0xff);

    this._ensure(bytes.length + 2);
    this._buf[this._offset++] = tag;
    this._buf[this._offset++] = bytes.length;

    while (bytes.length) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this._buf[this._offset++] = bytes.pop()!;
    }
  }

  /**
   * Writes Null to the buffer.
   * It takes 2 bytes, one for the Null tag and one for int value 0.
   */
  public writeNull(): void {
    this.writeByte(Ber.Null);
    this.writeByte(0x00);
  }

  /**
   * Writes the value of an enumeration to the buffer
   * @param integer - The integer value of the enumeration to write
   * @param tag - The tag to write
   */
  public writeEnumeration(integer: number, tag?: number): void {
    checkDataType(integer, 'integer', 'argument must be an Integer');
    tag = validateTag(tag, Ber.Enumeration);

    this.writeInt(integer, tag);
  }

  /**
   * Writes a boolean to the buffer
   * @param bool - The boolean to write
   * @param tag - The tag to write
   */
  public writeBoolean(bool: boolean, tag?: number) {
    checkDataType(bool, 'boolean', 'argument must be a Boolean');
    tag = validateTag(tag, Ber.Boolean);

    this._ensure(3);
    this._buf[this._offset++] = tag;
    this._buf[this._offset++] = 0x01;
    this._buf[this._offset++] = bool ? 0xff : 0x00;
  }

  /**
   * Writes a string to the buffer
   * @param str - The string to write
   * @param tag - The tag to write
   */
  public writeString(str: string, tag?: number) {
    checkDataType(str, 'string', 'argument must be a string');
    tag = validateTag(tag, Ber.OctetString);

    const len = Buffer.byteLength(str);
    this.writeByte(tag);
    this.writeLength(len);
    if (len) {
      this._ensure(len);
      this._buf.write(str, this._offset);
      this._offset += len;
    }
  }

  /**
   * Writes an entire source buffer to the underlying buffer
   * @param buf - The buffer to write
   * @param tag - The tag to write
   */
  public writeBuffer(buf: Buffer, tag?: number) {
    checkDataType(buf, 'buffer', 'argument must be a buffer');

    // If no tag is specified we will assume `buf` already contains tag and length
    if (typeof tag === 'number') {
      this.writeByte(tag);
      this.writeLength(buf.length);
    }

    if (buf.length > 0) {
      this._ensure(buf.length);
      buf.copy(this._buf, this._offset, 0, buf.length);
      this._offset += buf.length;
    }
  }

  /**
   * Writes an array of strings to the buffer
   * @param stringsArr - The array of strings to write
   * @param tag - The tag to write
   */
  public writeStringArray(stringsArr: string[], tag?: number) {
    checkDataType(stringsArr, 'array', 'argument must be an Array[String]');

    stringsArr.forEach(str => {
      this.writeString(str, tag);
    });
  }

  /**
   * Writes an object identifier to the buffer
   * @param oid - The OID to write
   * @param tag - The tag to write
   */
  public writeOID(oid: string, tag?: number) {
    checkDataType(oid, 'string', 'argument must be a string');
    tag = validateTag(tag, Ber.OID);

    if (!/^([0-9]+\.){0,}[0-9]+$/.test(oid)) {
      throw new Error('argument is not a valid OID string');
    }

    const tokens = oid.split('.');
    const bytes = [parseInt(tokens[0], 10) * 40 + parseInt(tokens[1], 10)];
    tokens.slice(2).forEach(token => {
      this._encodeOctet(bytes, parseInt(token, 10));
    });

    this._ensure(bytes.length + 2);
    this.writeByte(tag);
    this.writeLength(bytes.length);
    bytes.forEach(byte => {
      this.writeByte(byte);
    });
  }

  /**
   * Writes a number representing the length to the buffer
   * @param len - The length to write
   * @throws InvalidAsn1Error when length is too long, more than 4 bytes
   */
  public writeLength(len: number): void {
    checkDataType(len, 'number', 'argument must be a Number');

    this._ensure(4);

    if (len <= 0x7f) {
      this._buf[this._offset++] = len;
    } else if (len <= 0xff) {
      this._buf[this._offset++] = 0x81;
      this._buf[this._offset++] = len;
    } else if (len <= 0xffff) {
      this._buf[this._offset++] = 0x82;
      this._buf[this._offset++] = len >> 8;
      this._buf[this._offset++] = len;
    } else if (len <= 0xffffff) {
      this._buf[this._offset++] = 0x83;
      this._buf[this._offset++] = len >> 16;
      this._buf[this._offset++] = len >> 8;
      this._buf[this._offset++] = len;
    } else {
      throw new InvalidAsn1Error('Length too long (> 4 bytes)');
    }
  }

  /**
   * Starts a sequence by writing the sequence tag to the buffer.
   * @param tag - The tag to write.
   */
  public startSequence(tag?: number): void {
    tag = validateTag(tag, Ber.Sequence | Ber.Constructor);

    this.writeByte(tag);
    this._seq.push(this._offset);
    this._ensure(3);
    this._offset += 3;
  }

  /**
   * Ends the current sequence by finalizing its length and updating the buffer.
   * @throws InvalidAsn1Error when the sequence is too long, more than 4 bytes.
   */
  public endSequence(): void {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const seq = this._seq.pop()!;
    const start = seq + 3;
    const len = this._offset - start;

    if (len <= 0x7f) {
      this._shift(start, len, -2);
      this._buf[seq] = len;
    } else if (len <= 0xff) {
      this._shift(start, len, -1);
      this._buf[seq] = 0x81;
      this._buf[seq + 1] = len;
    } else if (len <= 0xffff) {
      this._buf[seq] = 0x82;
      this._buf[seq + 1] = len >> 8;
      this._buf[seq + 2] = len;
    } else if (len <= 0xffffff) {
      this._shift(start, len, 1);
      this._buf[seq] = 0x83;
      this._buf[seq + 1] = len >> 16;
      this._buf[seq + 2] = len >> 8;
      this._buf[seq + 3] = len;
    } else {
      throw new InvalidAsn1Error('Sequence too long');
    }
  }

  /**
   * Shifts the internal buffer to accommodate for changes in length.
   * @param start - The start index of the buffer to shift.
   * @param len - The length of the buffer to shift.
   * @param shift - The amount of shift to apply.
   */
  private _shift(start: number, len: number, shift: number): void {
    assert.ok(start !== undefined);
    assert.ok(len !== undefined);
    assert.ok(shift);

    this._buf.copy(this._buf, start + shift, start, start + len);
    this._offset += shift;
  }

  /**
   * Ensures that the buffer has enough space to write the given amount of bytes.
   * If the current buffer is not large enough, it will be resized based on growth factor.
   * @param len - The length to ensure
   */
  private _ensure(len: number): void {
    assert.ok(len);

    if (this._size - this._offset < len) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      let sz = this._size * this._options.growthFactor!;
      if (sz - this._offset < len) sz += len;

      const buf = Buffer.alloc(sz);

      this._buf.copy(buf, 0, 0, this._offset);
      this._buf = buf;
      this._size = sz;
    }
  }

  /**
   * Encodes an octet value and appends it to the given byte array.
   * @param bytes - The byte array to which the encoded octet should be appended.
   * @param octet - The octet value to encode and append.
   */
  private _encodeOctet(bytes: number[], octet: number) {
    if (octet < 128) {
      bytes.push(octet);
    } else if (octet < 16384) {
      bytes.push((octet >>> 7) | 0x80);
      bytes.push(octet & 0x7f);
    } else if (octet < 2097152) {
      bytes.push((octet >>> 14) | 0x80);
      bytes.push(((octet >>> 7) | 0x80) & 0xff);
      bytes.push(octet & 0x7f);
    } else if (octet < 268435456) {
      bytes.push((octet >>> 21) | 0x80);
      bytes.push(((octet >>> 14) | 0x80) & 0xff);
      bytes.push(((octet >>> 7) | 0x80) & 0xff);
      bytes.push(octet & 0x7f);
    } else {
      bytes.push(((octet >>> 28) | 0x80) & 0xff);
      bytes.push(((octet >>> 21) | 0x80) & 0xff);
      bytes.push(((octet >>> 14) | 0x80) & 0xff);
      bytes.push(((octet >>> 7) | 0x80) & 0xff);
      bytes.push(octet & 0x7f);
    }
  }
}
