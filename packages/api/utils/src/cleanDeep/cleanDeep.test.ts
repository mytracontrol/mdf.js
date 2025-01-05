/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { cleanDeep, CleanDeepOptions } from './cleanDeep';

describe('cleanDeep', () => {
  it('Should remove empty arrays, objects, strings, null and undefined values by default in objects', () => {
    const obj = {
      a: '',
      b: null,
      c: undefined,
      d: [],
      e: {},
      f: 'value',
      g: 0,
      h: false,
    };
    const result = cleanDeep(obj);
    expect(result).toEqual({ f: 'value', g: 0, h: false });
  });
  it('Should remove empty arrays, objects, strings, null and undefined values by default in arrays', () => {
    const obj = [
      '',
      null,
      undefined,
      [],
      {},
      'value',
      0,
      false,
      {
        a: '',
        b: null,
        c: undefined,
        d: [],
        e: {},
        f: 'value',
      },
      ['', null, undefined, [], {}, 'value'],
    ];
    const result = cleanDeep(obj);
    expect(result).toEqual(['value', 0, false, { f: 'value' }, ['value']]);
  });
  it('Should remove NaN values when NaNValues option is true', () => {
    const obj = {
      a: NaN,
      b: 'value',
    };
    const options: CleanDeepOptions = { NaNValues: true };
    const result = cleanDeep(obj, options);
    expect(result).toEqual({ b: 'value' });
  });
  it('Should remove specified keys', () => {
    const obj = {
      a: 'value1',
      b: 'value2',
      c: 'value3',
    };
    const options: CleanDeepOptions = { cleanKeys: ['b', 'c'] };
    const result = cleanDeep(obj, options);
    expect(result).toEqual({ a: 'value1' });
  });
  it('Should remove specified values', () => {
    const obj = {
      a: 'value1',
      b: 'value2',
      c: 'value3',
    };
    const options: CleanDeepOptions = { cleanValues: ['value2', 'value3'] };
    const result = cleanDeep(obj, options);
    expect(result).toEqual({ a: 'value1' });
  });
  it('Should process nested objects and arrays', () => {
    const obj = {
      a: {
        b: '',
        c: null,
        d: undefined,
        e: [],
        f: {},
        g: 'value',
      },
      h: [null, undefined, '', 'value'],
    };
    const result = cleanDeep(obj);
    expect(result).toEqual({ a: { g: 'value' }, h: ['value'] });
  });
  it('Should not process nested objects and arrays when nested option is false', () => {
    const obj = {
      a: {
        b: '',
        c: null,
        d: undefined,
        e: [],
        f: {},
        g: 'value',
      },
      h: [null, undefined, '', 'value'],
    };
    const options: CleanDeepOptions = { nested: false };
    const result = cleanDeep(obj, options);
    expect(result).toEqual({
      a: { b: '', c: null, d: undefined, e: [], f: {}, g: 'value' },
      h: [null, undefined, '', 'value'],
    });
  });
  it('Should throw an error if cleanKeys contains non-string values', () => {
    const obj = { a: 'value' };
    const options: CleanDeepOptions = { cleanKeys: [1 as any] };
    expect(() => cleanDeep(obj, options)).toThrow('cleanKeys option must be an array of strings');
  });
  it('Should throw an error if cleanValues is not an array', () => {
    const obj = { a: 'value' };
    const options: CleanDeepOptions = { cleanValues: 'value' as any };
    expect(() => cleanDeep(obj, options)).toThrow('cleanValues option must be an array');
  });
  it('Should throw an error if try to clean a non object', () => {
    const obj = 'value';
    // @ts-expect-error - Testing invalid input
    expect(() => cleanDeep(obj)).toThrow('Only objects and arrays are allowed');
  });
});
