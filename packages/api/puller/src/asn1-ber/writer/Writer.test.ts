/**
 * In this file we implement the unit tests for the Reader class using typescript and jest.
 */

import { BerWriter } from '.';

describe('#Puller #asn1-ber #Writer', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('#Happy path', () => {
    describe('#Instance', () => {
      it(`Should create a new instance of Writer`, () => {
        const writer = new BerWriter();
        expect(writer).toBeDefined();
        expect(writer).toBeInstanceOf(BerWriter);
      });
    });

    describe('#writeByte', () => {
      it(`Should write a value`, () => {
        const writer = new BerWriter();
        writer.writeByte(0xc2);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(1);
        expect(buffer[0]).toBe(0xc2);
      });
    });

    describe('#writeInt', () => {
      it(`Should write zero`, () => {
        const writer = new BerWriter();
        writer.writeInt(0);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(3);
        expect(buffer[0]).toBe(0x02);
        expect(buffer[1]).toBe(0x01);
        expect(buffer[2]).toBe(0x00);
      });

      it(`Should write 1 byte positive integers - lowest`, () => {
        const writer = new BerWriter();
        writer.writeInt(1);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(3);
        expect(buffer[0]).toBe(0x02);
        expect(buffer[1]).toBe(0x01);
        expect(buffer[2]).toBe(0x01);
      });

      it(`Should write 1 byte positive integers - middle`, () => {
        const writer = new BerWriter();
        writer.writeInt(101);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(3);
        expect(buffer[0]).toBe(0x02);
        expect(buffer[1]).toBe(0x01);
        expect(buffer[2]).toBe(0x65);
      });

      it(`Should write 1 byte positive integers - highest`, () => {
        const writer = new BerWriter();
        writer.writeInt(127);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(3);
        expect(buffer[0]).toBe(0x02);
        expect(buffer[1]).toBe(0x01);
        expect(buffer[2]).toBe(0x7f);
      });

      it(`Should write 2 byte positive integers - lowest`, () => {
        const writer = new BerWriter();
        writer.writeInt(128);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(4);
        expect(buffer[0]).toBe(0x02);
        expect(buffer[1]).toBe(0x02);
        expect(buffer[2]).toBe(0x00);
        expect(buffer[3]).toBe(0x80);
      });

      it(`Should write 2 byte positive integers - middle`, () => {
        const writer = new BerWriter();
        writer.writeInt(9374);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(4);
        expect(buffer[0]).toBe(0x02);
        expect(buffer[1]).toBe(0x02);
        expect(buffer[2]).toBe(0x24);
        expect(buffer[3]).toBe(0x9e);
      });

      it(`Should write 2 byte positive integers - highest`, () => {
        const writer = new BerWriter();
        writer.writeInt(32767);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(4);
        expect(buffer[0]).toBe(0x02);
        expect(buffer[1]).toBe(0x02);
        expect(buffer[2]).toBe(0x7f);
        expect(buffer[3]).toBe(0xff);
      });

      it(`Should write 3 byte positive integers - lowest`, () => {
        const writer = new BerWriter();
        writer.writeInt(32768);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(5);
        expect(buffer[0]).toBe(0x02);
        expect(buffer[1]).toBe(0x03);
        expect(buffer[2]).toBe(0x00);
        expect(buffer[3]).toBe(0x80);
        expect(buffer[4]).toBe(0x00);
      });

      it(`Should write 3 byte positive integers - middle`, () => {
        const writer = new BerWriter();
        writer.writeInt(5938243);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(5);
        expect(buffer[0]).toBe(0x02);
        expect(buffer[1]).toBe(0x03);
        expect(buffer[2]).toBe(0x5a);
        expect(buffer[3]).toBe(0x9c);
        expect(buffer[4]).toBe(0x43);
      });

      it(`Should write 3 byte positive integers - highest`, () => {
        const writer = new BerWriter();
        writer.writeInt(8388607);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(5);
        expect(buffer[0]).toBe(0x02);
        expect(buffer[1]).toBe(0x03);
        expect(buffer[2]).toBe(0x7f);
        expect(buffer[3]).toBe(0xff);
        expect(buffer[4]).toBe(0xff);
      });

      it(`Should write 4 byte positive integers - lowest`, () => {
        const writer = new BerWriter();
        writer.writeInt(8388608);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(6);
        expect(buffer[0]).toBe(0x02);
        expect(buffer[1]).toBe(0x04);
        expect(buffer[2]).toBe(0x00);
        expect(buffer[3]).toBe(0x80);
        expect(buffer[4]).toBe(0x00);
        expect(buffer[5]).toBe(0x00);
      });

      it(`Should write 4 byte positive integers - middle`, () => {
        const writer = new BerWriter();
        writer.writeInt(1483722690);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(6);
        expect(buffer[0]).toBe(0x02);
        expect(buffer[1]).toBe(0x04);
        expect(buffer[2]).toBe(0x58);
        expect(buffer[3]).toBe(0x6f);
        expect(buffer[4]).toBe(0xcf);
        expect(buffer[5]).toBe(0xc2);
      });

      it(`Should write 4 byte positive integers - highest`, () => {
        const writer = new BerWriter();
        writer.writeInt(2147483647);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(6);
        expect(buffer[0]).toBe(0x02);
        expect(buffer[1]).toBe(0x04);
        expect(buffer[2]).toBe(0x7f);
        expect(buffer[3]).toBe(0xff);
        expect(buffer[4]).toBe(0xff);
        expect(buffer[5]).toBe(0xff);
      });

      it(`Should write 5 byte positive integers - lowest`, () => {
        const writer = new BerWriter();
        writer.writeInt(2147483648);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(7);
        expect(buffer[0]).toBe(0x02);
        expect(buffer[1]).toBe(0x05);
        expect(buffer[2]).toBe(0x00);
        expect(buffer[3]).toBe(0x80);
        expect(buffer[4]).toBe(0x00);
        expect(buffer[5]).toBe(0x00);
        expect(buffer[6]).toBe(0x00);
      });

      it(`Should write 5 byte positive integers - middle`, () => {
        const writer = new BerWriter();
        writer.writeInt(3843548325);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(7);
        expect(buffer[0]).toBe(0x02);
        expect(buffer[1]).toBe(0x05);
        expect(buffer[2]).toBe(0x00);
        expect(buffer[3]).toBe(0xe5);
        expect(buffer[4]).toBe(0x17);
        expect(buffer[5]).toBe(0xe4);
        expect(buffer[6]).toBe(0xa5);
      });

      it(`Should write 5 byte positive integers - highest`, () => {
        const writer = new BerWriter();
        writer.writeInt(4294967295);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(7);
        expect(buffer[0]).toBe(0x02);
        expect(buffer[1]).toBe(0x05);
        expect(buffer[2]).toBe(0x00);
        expect(buffer[3]).toBe(0xff);
        expect(buffer[4]).toBe(0xff);
        expect(buffer[5]).toBe(0xff);
        expect(buffer[6]).toBe(0xff);
      });

      it(`Should write 1 byte negative integers - lowest`, () => {
        const writer = new BerWriter();
        writer.writeInt(-128);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(3);
        expect(buffer[0]).toBe(0x02);
        expect(buffer[1]).toBe(0x01);
        expect(buffer[2]).toBe(0x80);
      });

      it(`Should write 1 byte negative integers - middle`, () => {
        const writer = new BerWriter();
        writer.writeInt(-73);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(3);
        expect(buffer[0]).toBe(0x02);
        expect(buffer[1]).toBe(0x01);
        expect(buffer[2]).toBe(0xb7);
      });

      it(`Should write 1 byte negative integers - highest`, () => {
        const writer = new BerWriter();
        writer.writeInt(-1);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(3);
        expect(buffer[0]).toBe(0x02);
        expect(buffer[1]).toBe(0x01);
        expect(buffer[2]).toBe(0xff);
      });

      it(`Should write 2 byte negative integers - lowest`, () => {
        const writer = new BerWriter();
        writer.writeInt(-32768);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(4);
        expect(buffer[0]).toBe(0x02);
        expect(buffer[1]).toBe(0x02);
        expect(buffer[2]).toBe(0x80);
        expect(buffer[3]).toBe(0x00);
      });

      it(`Should write 2 byte negative integers - middle`, () => {
        const writer = new BerWriter();
        writer.writeInt(-22400);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(4);
        expect(buffer[0]).toBe(0x02);
        expect(buffer[1]).toBe(0x02);
        expect(buffer[2]).toBe(0xa8);
        expect(buffer[3]).toBe(0x80);
      });

      it(`Should write 2 byte negative integers - highest`, () => {
        const writer = new BerWriter();
        writer.writeInt(-129);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(4);
        expect(buffer[0]).toBe(0x02);
        expect(buffer[1]).toBe(0x02);
        expect(buffer[2]).toBe(0xff);
        expect(buffer[3]).toBe(0x7f);
      });

      it(`Should write 3 byte negative integers - lowest`, () => {
        const writer = new BerWriter();
        writer.writeInt(-8388608);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(5);
        expect(buffer[0]).toBe(0x02);
        expect(buffer[1]).toBe(0x03);
        expect(buffer[2]).toBe(0x80);
        expect(buffer[3]).toBe(0x00);
        expect(buffer[4]).toBe(0x00);
      });

      it(`Should write 3 byte negative integers - middle`, () => {
        const writer = new BerWriter();
        writer.writeInt(-481653);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(5);
        expect(buffer[0]).toBe(0x02);
        expect(buffer[1]).toBe(0x03);
        expect(buffer[2]).toBe(0xf8);
        expect(buffer[3]).toBe(0xa6);
        expect(buffer[4]).toBe(0x8b);
      });

      it(`Should write 3 byte negative integers - highest`, () => {
        const writer = new BerWriter();
        writer.writeInt(-32769);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(5);
        expect(buffer[0]).toBe(0x02);
        expect(buffer[1]).toBe(0x03);
        expect(buffer[2]).toBe(0xff);
        expect(buffer[3]).toBe(0x7f);
        expect(buffer[4]).toBe(0xff);
      });

      it(`Should write 4 byte negative integers - lowest`, () => {
        const writer = new BerWriter();
        writer.writeInt(-2147483648);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(6);
        expect(buffer[0]).toBe(0x02);
        expect(buffer[1]).toBe(0x04);
        expect(buffer[2]).toBe(0x80);
        expect(buffer[3]).toBe(0x00);
        expect(buffer[4]).toBe(0x00);
        expect(buffer[5]).toBe(0x00);
      });

      it(`Should write 4 byte negative integers - middle`, () => {
        const writer = new BerWriter();
        writer.writeInt(-1522904131);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(6);
        expect(buffer[0]).toBe(0x02);
        expect(buffer[1]).toBe(0x04);
        expect(buffer[2]).toBe(0xa5);
        expect(buffer[3]).toBe(0x3a);
        expect(buffer[4]).toBe(0x53);
        expect(buffer[5]).toBe(0xbd);
      });

      it(`Should write 4 byte negative integers - highest`, () => {
        const writer = new BerWriter();
        writer.writeInt(-8388609);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(6);
        expect(buffer[0]).toBe(0x02);
        expect(buffer[1]).toBe(0x04);
        expect(buffer[2]).toBe(0xff);
        expect(buffer[3]).toBe(0x7f);
        expect(buffer[4]).toBe(0xff);
        expect(buffer[5]).toBe(0xff);
      });
    });

    describe('#writeBoolean', () => {
      it(`Should write a true and false value`, () => {
        const writer = new BerWriter();
        writer.writeBoolean(true);
        writer.writeBoolean(false);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(6);
        expect(buffer[0]).toBe(0x01);
        expect(buffer[1]).toBe(0x01);
        expect(buffer[2]).toBe(0xff);
        expect(buffer[3]).toBe(0x01);
        expect(buffer[4]).toBe(0x01);
        expect(buffer[5]).toBe(0x00);
      });
    });

    describe('#writeString', () => {
      it(`Should write a value`, () => {
        const writer = new BerWriter();
        writer.writeString('hello world');

        const buffer = writer.buffer;

        expect(buffer.length).toBe(13);
        expect(buffer[0]).toBe(0x04);
        expect(buffer[1]).toBe(11);
        expect(buffer.subarray(2).toString('utf8')).toBe('hello world');
      });
    });

    describe('#writeBuffer', () => {
      it(`Should write a value`, () => {
        const writer = new BerWriter();
        writer.writeString('hello world');

        const expected = Buffer.from([
          0x04, 0x0b, 0x30, 0x09, 0x02, 0x01, 0x0f, 0x01, 0x01, 0xff, 0x01, 0x01, 0xff,
        ]);
        writer.writeBuffer(expected.subarray(2, expected.length), 0x04);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(26);
        expect(buffer[0]).toBe(0x04);
        expect(buffer[1]).toBe(11);
        expect(buffer.subarray(2, 13).toString('utf8')).toBe('hello world');
        expect(buffer[13]).toBe(expected[0]);
        expect(buffer[14]).toBe(expected[1]);

        for (let i = 13, j = 0; i < buffer.length && j < expected.length; i++, j++)
          expect(buffer[i]).toBe(expected[j]);
      });
    });

    describe('#writeStringArray', () => {
      it(`Should write an array of strings`, () => {
        const writer = new BerWriter();
        writer.writeStringArray(['hello world', 'fubar!']);

        const buffer = writer.buffer;

        expect(buffer.length).toBe(21);
        expect(buffer[0]).toBe(0x04);
        expect(buffer[1]).toBe(11);
        expect(buffer.subarray(2, 13).toString('utf8')).toBe('hello world');

        expect(buffer[13]).toBe(0x04);
        expect(buffer[14]).toBe(6);
        expect(buffer.subarray(15).toString('utf8')).toBe('fubar!');
      });
    });

    describe('#oversized data', () => {
      it(`Should result in a buffer resize`, () => {
        const writer = new BerWriter({ size: 2 });
        writer.writeString('hello world');

        const buffer = writer.buffer;

        expect(buffer.length).toBe(13);
        expect(buffer[0]).toBe(0x04);
        expect(buffer[1]).toBe(11);
        expect(buffer.subarray(2).toString('utf8')).toBe('hello world');
      });
    });

    describe('#complex sequences', () => {
      it(`Should be processed correctly`, () => {
        const writer = new BerWriter({ size: 25 });
        writer.startSequence();
        writer.writeString('hello world');
        writer.endSequence();

        const buffer = writer.buffer;

        expect(buffer.length).toBe(15);
        expect(buffer[0]).toBe(0x30);
        expect(buffer[1]).toBe(13);
        expect(buffer[2]).toBe(0x04);
        expect(buffer[3]).toBe(11);
        expect(buffer.subarray(4).toString('utf8')).toBe('hello world');
      });
    });

    describe('#nested sequences', () => {
      it(`Should be processed correctly`, () => {
        const writer = new BerWriter({ size: 25 });
        writer.startSequence();
        writer.writeString('hello world');
        writer.startSequence();
        writer.writeString('hello world');
        writer.endSequence();
        writer.endSequence();

        const buffer = writer.buffer;

        expect(buffer.length).toBe(30);
        expect(buffer[0]).toBe(0x30);
        expect(buffer[1]).toBe(28);
        expect(buffer[2]).toBe(0x04);
        expect(buffer[3]).toBe(11);
        expect(buffer.subarray(4, 15).toString('utf8')).toBe('hello world');

        expect(buffer[15]).toBe(0x30);
        expect(buffer[16]).toBe(13);
        expect(buffer[17]).toBe(0x04);
        expect(buffer[18]).toBe(11);
        expect(buffer.subarray(19, 30).toString('utf8')).toBe('hello world');
      });
    });

    describe('#multiple sequences', () => {
      it(`Should be processed correctly`, () => {
        // An anonymous LDAP v3 BIND request
        const dn = 'cn=foo,ou=unit,o=test';

        const writer = new BerWriter();
        writer.startSequence();
        writer.writeInt(3);
        writer.startSequence(0x60);
        writer.writeInt(3);
        writer.writeString(dn);
        writer.writeByte(0x80);
        writer.writeByte(0x00);
        writer.endSequence();
        writer.endSequence();

        const buffer = writer.buffer;

        expect(buffer.length).toBe(35);
        expect(buffer[0]).toBe(0x30);
        expect(buffer[1]).toBe(33);
        expect(buffer[2]).toBe(0x02);
        expect(buffer[3]).toBe(1);
        expect(buffer[4]).toBe(0x03);
        expect(buffer[5]).toBe(0x60);
        expect(buffer[6]).toBe(28);
        expect(buffer[7]).toBe(0x02);
        expect(buffer[8]).toBe(1);
        expect(buffer[9]).toBe(0x03);
        expect(buffer[10]).toBe(0x04);
        expect(buffer[11]).toBe(dn.length);
        expect(buffer.subarray(12, 33).toString('utf8')).toBe(dn);
        expect(buffer[33]).toBe(0x80);
        expect(buffer[34]).toBe(0x00);
      });
    });

    describe('#writeOID', () => {
      it('Should write a value', () => {
        const writer = new BerWriter();
        writer.writeOID('1.2.840.113549.1.1.1');

        const buffer = writer.buffer;

        expect(buffer.toString('hex')).toBe('06092a864886f70d010101');
      });
    });
  });
});
