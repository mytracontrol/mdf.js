/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { BerReader } from '.';

describe('#Puller #asn1-ber #Reader', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('#Happy path', () => {
    describe('#Instance', () => {
      it(`Should create a new instance of Reader`, () => {
        const buffer = Buffer.from('test');
        const reader = new BerReader(buffer);
        expect(reader).toBeDefined();
        expect(reader).toBeInstanceOf(BerReader);
      });
    });

    describe('#readByte', () => {
      it(`Should read a value`, () => {
        const reader = new BerReader(Buffer.from([0xde]));
        expect(reader.readByte()).toBe(0xde);
      });
    });

    describe('#readByte', () => {
      it('Should read zero', () => {
        const reader = new BerReader(Buffer.from([0x02, 0x01, 0x00]));
        expect(reader.readInt()).toBe(0);
        expect(reader.length).toBe(1);
      });

      it('Should read a 1 byte positive integer - lowest', () => {
        const reader = new BerReader(Buffer.from([0x02, 0x01, 0x01]));
        expect(reader.readInt()).toBe(1);
        expect(reader.length).toBe(1);
      });

      it(`Should read a 1 byte positive integer - middle`, () => {
        const reader = new BerReader(Buffer.from([0x02, 0x01, 0x34]));
        expect(reader.readInt()).toBe(52);
        expect(reader.length).toBe(1);
      });

      it(`Should read a 1 byte positive integer - highest`, () => {
        const reader = new BerReader(Buffer.from([0x02, 0x01, 0x7f]));
        expect(reader.readInt()).toBe(127);
        expect(reader.length).toBe(1);
      });

      it(`Should read a 2 byte positive integer - lowest`, () => {
        const reader = new BerReader(Buffer.from([0x02, 0x02, 0x00, 0x80]));
        expect(reader.readInt()).toBe(128);
        expect(reader.length).toBe(2);
      });

      it(`Should read a 2 byte positive integer - middle`, () => {
        const reader = new BerReader(Buffer.from([0x02, 0x02, 0x7e, 0xde]));
        expect(reader.readInt()).toBe(0x7ede);
        expect(reader.length).toBe(2);
      });

      it(`Should read a 2 byte positive integer - highest`, () => {
        const reader = new BerReader(Buffer.from([0x02, 0x02, 0x7f, 0xff]));
        expect(reader.readInt()).toBe(32767);
        expect(reader.length).toBe(2);
      });

      it(`Should read a 3 byte positive integer - lowest`, () => {
        const reader = new BerReader(Buffer.from([0x02, 0x03, 0x00, 0x80, 0x00]));
        expect(reader.readInt()).toBe(32768);
        expect(reader.length).toBe(3);
      });

      it(`Should read a 3 byte positive integer - middle`, () => {
        const reader = new BerReader(Buffer.from([0x02, 0x03, 0x7e, 0xde, 0x03]));
        expect(reader.readInt()).toBe(8314371);
        expect(reader.length).toBe(3);
      });

      it(`Should read a 3 byte positive integer - highest`, () => {
        const reader = new BerReader(Buffer.from([0x02, 0x03, 0x7e, 0xde, 0x03]));
        expect(reader.readInt()).toBe(0x7ede03);
        expect(reader.length).toBe(3);
      });

      it(`Should read a 4 byte positive integer - lowest`, () => {
        const reader = new BerReader(Buffer.from([0x02, 0x04, 0x00, 0x80, 0x00, 0x00]));
        expect(reader.readInt()).toBe(8388608);
        expect(reader.length).toBe(4);
      });

      it(`Should read a 4 byte positive integer - middle`, () => {
        const reader = new BerReader(Buffer.from([0x02, 0x04, 0x7e, 0xde, 0x03, 0x01]));
        expect(reader.readInt()).toBe(2128478977);
        expect(reader.length).toBe(4);
      });

      it(`Should read a 4 byte positive integer - highest`, () => {
        const reader = new BerReader(Buffer.from([0x02, 0x04, 0x7f, 0xff, 0xff, 0xff]));
        expect(reader.readInt()).toBe(2147483647);
        expect(reader.length).toBe(4);
      });

      it(`Should read a 5 byte positive integer - lowest`, () => {
        const reader = new BerReader(Buffer.from([0x02, 0x05, 0x00, 0x80, 0x00, 0x00, 0x00]));
        expect(reader.readInt()).toBe(2147483648);
        expect(reader.length).toBe(5);
      });

      it(`Should read a 5 byte positive integer - middle`, () => {
        const reader = new BerReader(Buffer.from([0x02, 0x05, 0x00, 0x8b, 0xde, 0x03, 0x01]));
        expect(reader.readInt()).toBe(2346582785);
        expect(reader.length).toBe(5);
      });

      it(`Should read a 5 byte positive integer - highest`, () => {
        const reader = new BerReader(Buffer.from([0x02, 0x05, 0x00, 0xff, 0xff, 0xff, 0xff]));
        expect(reader.readInt()).toBe(4294967295);
        expect(reader.length).toBe(5);
      });

      it(`Should read a 1 byte negative integer - lowest`, () => {
        const reader = new BerReader(Buffer.from([0x02, 0x01, 0x80]));
        expect(reader.readInt()).toBe(-128);
        expect(reader.length).toBe(1);
      });

      it(`Should read a 1 byte negative integer - middle`, () => {
        const reader = new BerReader(Buffer.from([0x02, 0x01, 0xdc]));
        expect(reader.readInt()).toBe(-36);
        expect(reader.length).toBe(1);
      });

      it(`Should read a 1 byte negative integer - highest`, () => {
        const reader = new BerReader(Buffer.from([0x02, 0x01, 0xff]));
        expect(reader.readInt()).toBe(-1);
        expect(reader.length).toBe(1);
      });

      it(`Should read a 2 byte negative integer - lowest`, () => {
        const reader = new BerReader(Buffer.from([0x02, 0x02, 0x80, 0x00]));
        expect(reader.readInt()).toBe(-32768);
        expect(reader.length).toBe(2);
      });

      it(`Should read a 2 byte negative integer - middle`, () => {
        const reader = new BerReader(Buffer.from([0x02, 0x02, 0xc0, 0x4e]));
        expect(reader.readInt()).toBe(-16306);
        expect(reader.length).toBe(2);
      });

      it(`Should read a 2 byte negative integer - highest`, () => {
        const reader = new BerReader(Buffer.from([0x02, 0x02, 0xff, 0x7f]));
        expect(reader.readInt()).toBe(-129);
        expect(reader.length).toBe(2);
      });

      it(`Should read a 3 byte negative integer - lowest`, () => {
        const reader = new BerReader(Buffer.from([0x02, 0x03, 0x80, 0x00, 0x00]));
        expect(reader.readInt()).toBe(-8388608);
        expect(reader.length).toBe(3);
      });

      it(`Should read a 3 byte negative integer - middle`, () => {
        const reader = new BerReader(Buffer.from([0x02, 0x03, 0xff, 0x00, 0x19]));
        expect(reader.readInt()).toBe(-65511);
        expect(reader.length).toBe(3);
      });

      it(`Should read a 3 byte negative integer - highest`, () => {
        const reader = new BerReader(Buffer.from([0x02, 0x03, 0xff, 0x7f, 0xff]));
        expect(reader.readInt()).toBe(-32769);
        expect(reader.length).toBe(3);
      });

      it(`Should read a 4 byte negative integer - lowest`, () => {
        const reader = new BerReader(Buffer.from([0x02, 0x04, 0x80, 0x00, 0x00, 0x00]));
        expect(reader.readInt()).toBe(-2147483648);
        expect(reader.length).toBe(4);
      });

      it(`Should read a 4 byte negative integer - middle`, () => {
        const reader = new BerReader(Buffer.from([0x02, 0x04, 0x91, 0x7c, 0x22, 0x1f]));
        expect(reader.readInt()).toBe(-1854135777);
        expect(reader.length).toBe(4);
      });

      it(`Should read a 4 byte negative integer - highest`, () => {
        const reader = new BerReader(Buffer.from([0x02, 0x04, 0xff, 0x7f, 0xff, 0xff]));
        expect(reader.readInt()).toBe(-8388609);
        expect(reader.length).toBe(4);
      });
    });

    describe('#readBoolean', () => {
      it(`Should read a true value`, () => {
        const reader = new BerReader(Buffer.from([0x01, 0x01, 0xff]));
        expect(reader.readBoolean()).toBe(true);
        expect(reader.length).toBe(0x01);
      });

      it(`Should read a false value`, () => {
        const reader = new BerReader(Buffer.from([0x01, 0x01, 0x00]));
        expect(reader.readBoolean()).toBe(false);
        expect(reader.length).toBe(0x01);
      });
    });

    describe('#readEnumeration', () => {
      it(`Should read a value`, () => {
        const reader = new BerReader(Buffer.from([0x0a, 0x01, 0x20]));
        expect(reader.readEnumeration()).toBe(0x20);
        expect(reader.length).toBe(0x01);
      });
    });

    describe('#readOID', () => {
      it(`Should not convert to unsigned`, () => {
        // Make sure 2887117176 is NOT converted to -1407850120
        const buffer = Buffer.from([
          6, 18, 43, 6, 1, 4, 1, 245, 12, 1, 1, 5, 1, 1, 19, 138, 224, 215, 210, 120,
        ]);
        const reader = new BerReader(buffer);
        expect(reader.readOID()).toBe('1.3.6.1.4.1.14988.1.1.5.1.1.19.2887117176');
        expect(reader.length).toBe(18);
      });
    });

    describe('#readString', () => {
      it(`Should read a value`, () => {
        const string = 'cn=foo,ou=unit,o=test';
        const buffer = Buffer.alloc(string.length + 2);
        buffer[0] = 0x04;
        buffer[1] = Buffer.byteLength(string);
        buffer.write(string, 2);

        const reader = new BerReader(buffer);
        expect(reader.readString()).toBe(string);
        expect(reader.length).toBe(string.length);
      });
    });

    describe('#readSequence', () => {
      it(`Should read a sequence`, () => {
        const reader = new BerReader(Buffer.from([0x30, 0x03, 0x01, 0x01, 0xff]));
        expect(reader.readSequence()).toBe(0x30);
        expect(reader.length).toBe(0x03);
        expect(reader.readBoolean()).toBe(true);
        expect(reader.length).toBe(0x01);
      });
    });

    describe('readBitString()', () => {
      it(`Should read a bit string`, () => {
        const reader = new BerReader(
          Buffer.from([0x03, 0x07, 0x04, 0x0a, 0x3b, 0x5f, 0x29, 0x1c, 0xd0])
        );
        expect(reader.readBitString()).toBe('00001010001110110101111100101001000111001101');
        expect(reader.length).toBe(7);
      });
    });

    describe('#complex sequences', () => {
      it('Should be processed correctly', () => {
        const buffer = Buffer.alloc(14);

        // An anonymous LDAP v3 BIND request
        buffer[0] = 0x30; // Sequence
        buffer[1] = 12; // len
        buffer[2] = 0x02; // ASN.1 Integer
        buffer[3] = 1; // len
        buffer[4] = 0x04; // msgid (make up 4)
        buffer[5] = 0x60; // Bind Request
        buffer[6] = 7; // len
        buffer[7] = 0x02; // ASN.1 Integer
        buffer[8] = 1; // len
        buffer[9] = 0x03; // v3
        buffer[10] = 0x04; // String (bind dn)
        buffer[11] = 0; // len
        buffer[12] = 0x80; // ContextSpecific (choice)
        buffer[13] = 0; // simple bind

        const reader = new BerReader(buffer);
        expect(reader.readSequence()).toBe(48);
        expect(reader.length).toBe(12);
        expect(reader.readInt()).toBe(4);
        expect(reader.readSequence()).toBe(96);
        expect(reader.length).toBe(7);
        expect(reader.readInt()).toBe(3);
        expect(reader.readString()).toBe('');
        expect(reader.length).toBe(0);
        expect(reader.readByte()).toBe(0x80);
        expect(reader.readByte()).toBe(0);
        expect(reader.readByte()).toBeNull();
      });

      describe('#long strings', () => {
        it('Should be parsed', () => {
          const buffer = Buffer.alloc(256);
          const string =
            '2;649;CN=Red Hat CS 71GA Demo,O=Red Hat CS 71GA Demo,C=US;' +
            'CN=RHCS Agent - admin01,UID=admin01,O=redhat,C=US [1] This is ' +
            "Teena Vradmin's description.";
          buffer[0] = 0x04;
          buffer[1] = 0x81;
          buffer[2] = 0x94;
          buffer.write(string, 3);

          const reader = new BerReader(buffer.subarray(0, 3 + string.length));
          expect(reader.readString()).toBe(string);
        });
      });
    });
  });
});
