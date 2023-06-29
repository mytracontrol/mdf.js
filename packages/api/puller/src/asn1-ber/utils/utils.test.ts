/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { InvalidAsn1Error } from '../errors/Errors';
import { checkDataType, checkExpectedTag, validateTag } from './utils';

describe('#Puller #asn1-ber #utils', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('#Happy path', () => {
    describe('#checkDataType', () => {
      it(`Should check integer type correctly`, () => {
        expect(() => checkDataType(5, 'integer', 'error message')).not.toThrow();
      });

      it(`Should check buffer type correctly`, () => {
        const buffer = Buffer.from('test');
        expect(() => checkDataType(buffer, 'buffer', 'error message')).not.toThrow();
      });

      it(`Should check array type correctly`, () => {
        const array = ['test'];
        expect(() => checkDataType(array, 'array', 'error message')).not.toThrow();
      });

      it(`Should check a basic type correctly`, () => {
        expect(() => checkDataType('test', 'string', 'error message')).not.toThrow();
      });
    });

    describe('#validateTag', () => {
      it(`Should return original tag when it is a number`, () => {
        expect(validateTag(5, 99)).toBe(5);
      });

      it(`Should return default tag when original one is not a number`, () => {
        expect(validateTag(undefined, 99)).toBe(99);
      });
    });

    describe('#checkExpectedTag', () => {
      it(`Should check expected tag correctly`, () => {
        expect(() => checkExpectedTag(1, 1)).not.toThrow();
      });
    });
  });

  describe('#Sad path', () => {
    describe('#checkDataType', () => {
      it(`Should throw an error when data type is not the same as provided`, () => {
        expect(() => checkDataType(5, 'string', 'error checking string type')).toThrow(
          new TypeError('error checking string type')
        );
        expect(() => checkDataType(2.5, 'integer', 'error checking integer type')).toThrow(
          new TypeError('error checking integer type')
        );
        expect(() => checkDataType(true, 'number', 'error checking number type')).toThrow(
          new TypeError('error checking number type')
        );
        expect(() => checkDataType('test', 'buffer', 'error checking buffer type')).toThrow(
          new TypeError('error checking buffer type')
        );
        expect(() =>
          checkDataType(Buffer.from('test'), 'array', 'error checking array type')
        ).toThrow(new TypeError('error checking array type'));
      });
    });

    describe('#checkExpectedTag', () => {
      it(`Should throw an error when read tag is not the same as expected tag`, () => {
        expect(() => checkExpectedTag(1, 2)).toThrow(new InvalidAsn1Error(`Expected 0x1: got 0x2`));
      });
    });
  });
});
