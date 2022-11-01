/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Mytra Control S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Mytra Control S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Mytra Control S.L.
 */
import { formatEnv } from './formatEnv';

const env = {
  EXAMPLE_OBJECT: '{"prop": "value"}',
  EXAMPLE_ARRAY: '[1,2,3, "string", {"prop": "value"}, 5.2]',
  EXAMPLE_INVALID_OBJECT: '{"prop": }"value"}',
  EXAMPLE_INVALID_ARRAY: '[1,2,3, "string", ]{"prop": "value"}, 5.2]',
  EXAMPLE_TRUE: 'true',
  EXAMPLE_FALSE: 'false',
  EXAMPLE_INT: '5',
  EXAMPLE_NEGATIVE_INT: '-11',
  EXAMPLE_FLOAT: '5.2456',
  EXAMPLE_NEGATIVE_FLOAT: '-2.4567',
  EXAMPLE_INT_ZERO: '0',
  EXAMPLE_FLOAT_ZERO: '0.00',
  EXAMPLE_NEGATIVE_INT_ZERO: '-0',
  EXAMPLE_NEGATIVE_FLOAT_ZERO: '-0.00',
  EXAMPLE_STRING: 'example',
  EXAMPLE_DEEP__OBJECT__PROPERTY: 'value',
  EXAMPLE_NOT_SHOULD_BE_SANITIZED: 5,
};

describe('#formatEnv', () => {
  describe('#Happy path', () => {
    it('Should return an object with the default environment variables in camel case', () => {
      process.env['MY_OWN_TEST'] = 'test';
      const result = formatEnv();
      expect(result['myOwnTest']).toEqual('test');
    });
    it('Should return an object with the properties without prefix', () => {
      // @ts-ignore - Test environment
      const result = formatEnv('EXAMPLE', undefined, env);
      expect(result).toEqual({
        object: { prop: 'value' },
        array: [1, 2, 3, 'string', { prop: 'value' }, 5.2],
        invalidObject: '{"prop": }"value"}',
        invalidArray: '[1,2,3, "string", ]{"prop": "value"}, 5.2]',
        true: true,
        false: false,
        int: 5,
        negativeInt: -11,
        float: 5.2456,
        negativeFloat: -2.4567,
        intZero: 0,
        floatZero: 0,
        negativeIntZero: -0,
        negativeFloatZero: -0,
        string: 'example',
        deep: {
          object: {
            property: 'value',
          },
        },
        notShouldBeSanitized: 5,
      });
    });
    it('Should return an object with the properties with prefix', () => {
      // @ts-ignore - Test environment
      const result = formatEnv(undefined, undefined, env);
      expect(result).toEqual({
        exampleObject: { prop: 'value' },
        exampleArray: [1, 2, 3, 'string', { prop: 'value' }, 5.2],
        exampleInvalidObject: '{"prop": }"value"}',
        exampleInvalidArray: '[1,2,3, "string", ]{"prop": "value"}, 5.2]',
        exampleTrue: true,
        exampleFalse: false,
        exampleInt: 5,
        exampleNegativeInt: -11,
        exampleFloat: 5.2456,
        exampleNegativeFloat: -2.4567,
        exampleIntZero: 0,
        exampleFloatZero: 0,
        exampleNegativeIntZero: -0,
        exampleNegativeFloatZero: -0,
        exampleString: 'example',
        exampleDeep: {
          object: {
            property: 'value',
          },
        },
        exampleNotShouldBeSanitized: 5,
      });
    });
    it('Should return an object with the properties without prefix and pascal case ', () => {
      // @ts-ignore - Test environment
      const result = formatEnv('EXAMPLE', { format: 'pascalcase' }, env);
      expect(result).toEqual({
        Object: { prop: 'value' },
        Array: [1, 2, 3, 'string', { prop: 'value' }, 5.2],
        InvalidObject: '{"prop": }"value"}',
        InvalidArray: '[1,2,3, "string", ]{"prop": "value"}, 5.2]',
        True: true,
        False: false,
        Int: 5,
        NegativeInt: -11,
        Float: 5.2456,
        NegativeFloat: -2.4567,
        IntZero: 0,
        FloatZero: 0,
        NegativeIntZero: -0,
        NegativeFloatZero: -0,
        String: 'example',
        Deep: {
          Object: {
            Property: 'value',
          },
        },
        NotShouldBeSanitized: 5,
      });
    });
    it('Should return an object with the properties without prefix and upper case ', () => {
      // @ts-ignore - Test environment
      const result = formatEnv('EXAMPLE', { format: 'uppercase' }, env);
      expect(result).toEqual({
        OBJECT: { prop: 'value' },
        ARRAY: [1, 2, 3, 'string', { prop: 'value' }, 5.2],
        INVALID_OBJECT: '{"prop": }"value"}',
        INVALID_ARRAY: '[1,2,3, "string", ]{"prop": "value"}, 5.2]',
        TRUE: true,
        FALSE: false,
        INT: 5,
        NEGATIVE_INT: -11,
        FLOAT: 5.2456,
        NEGATIVE_FLOAT: -2.4567,
        INT_ZERO: 0,
        FLOAT_ZERO: 0,
        NEGATIVE_INT_ZERO: -0,
        NEGATIVE_FLOAT_ZERO: -0,
        STRING: 'example',
        DEEP: {
          OBJECT: {
            PROPERTY: 'value',
          },
        },
        NOT_SHOULD_BE_SANITIZED: 5,
      });
    });
    it('Should return an object with the properties without prefix and lower case ', () => {
      // @ts-ignore - Test environment
      const result = formatEnv('EXAMPLE', { format: 'lowercase' }, env);
      expect(result).toEqual({
        object: { prop: 'value' },
        array: [1, 2, 3, 'string', { prop: 'value' }, 5.2],
        invalid_object: '{"prop": }"value"}',
        invalid_array: '[1,2,3, "string", ]{"prop": "value"}, 5.2]',
        true: true,
        false: false,
        int: 5,
        negative_int: -11,
        float: 5.2456,
        negative_float: -2.4567,
        int_zero: 0,
        float_zero: 0,
        negative_int_zero: -0,
        negative_float_zero: -0,
        string: 'example',
        deep: {
          object: {
            property: 'value',
          },
        },
        not_should_be_sanitized: 5,
      });
    });
    it('Should return an object with our own transforma applied', () => {
      const expectedResult = {
        HI_OBJECT: { prop: 'value' },
        HI_ARRAY: [1, 2, 3, 'string', { prop: 'value' }, 5.2],
        HI_INVALID_OBJECT: '{"prop": }"value"}',
        HI_INVALID_ARRAY: '[1,2,3, "string", ]{"prop": "value"}, 5.2]',
        HI_TRUE: true,
        HI_FALSE: false,
        HI_INT: 5,
        HI_NEGATIVE_INT: -11,
        HI_FLOAT: 5.2456,
        HI_NEGATIVE_FLOAT: -2.4567,
        HI_INT_ZERO: 0,
        HI_FLOAT_ZERO: 0.0,
        HI_NEGATIVE_INT_ZERO: -0,
        HI_NEGATIVE_FLOAT_ZERO: -0.0,
        HI_STRING: 'example',
        HI_DEEP: { HI_OBJECT: { HI_PROPERTY: 'value' } },
        HI_NOT_SHOULD_BE_SANITIZED: 5,
      };
      // @ts-ignore - Test environment
      expect(formatEnv('EXAMPLE', { format: (value: string) => 'HI_' + value }, env)).toEqual(
        expectedResult
      );
    });
  });
  describe('#Sad path', () => {
    it('Should return an object with no change in the keys if its not a valid format', () => {
      const expectedResult = {
        EXAMPLE_OBJECT: { prop: 'value' },
        EXAMPLE_ARRAY: [1, 2, 3, 'string', { prop: 'value' }, 5.2],
        EXAMPLE_INVALID_OBJECT: '{"prop": }"value"}',
        EXAMPLE_INVALID_ARRAY: '[1,2,3, "string", ]{"prop": "value"}, 5.2]',
        EXAMPLE_TRUE: true,
        EXAMPLE_FALSE: false,
        EXAMPLE_INT: 5,
        EXAMPLE_NEGATIVE_INT: -11,
        EXAMPLE_FLOAT: 5.2456,
        EXAMPLE_NEGATIVE_FLOAT: -2.4567,
        EXAMPLE_INT_ZERO: 0,
        EXAMPLE_FLOAT_ZERO: 0.0,
        EXAMPLE_NEGATIVE_INT_ZERO: -0,
        EXAMPLE_NEGATIVE_FLOAT_ZERO: -0.0,
        EXAMPLE_STRING: 'example',
        EXAMPLE_DEEP: { OBJECT: { PROPERTY: 'value' } },
        EXAMPLE_NOT_SHOULD_BE_SANITIZED: 5,
      };
      // @ts-ignore - Test environment
      expect(formatEnv(undefined, { format: 'myFormat' }, env)).toEqual(expectedResult);
      // @ts-ignore - Test environment
      expect(formatEnv(undefined, { format: 5 }, env)).toEqual(expectedResult);
    });
  });
});
