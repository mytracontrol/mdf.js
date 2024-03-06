/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { overwrite } from '.';

describe('#Puller #Parser', () => {
  const received = {
    key1: 'value1',
    key2: 'value2',
    key4: 'value4',
  };
  const defaults = {
    key1: 'default1',
    key2: 'default2',
    key3: 'default3',
  };
  afterEach(() => {
    jest.clearAllMocks();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('#Happy path', () => {
    it('Should overwrite values in onto with received values when the key exists in defaults', () => {
      const onto = {
        key1: 'existingValue',
        key3: 'existingValue',
        key5: 'existingValue',
      };
      const expectedResult = {
        key1: 'value1',
        key2: 'value2',
        key3: 'existingValue',
        key5: 'existingValue',
      };

      const result = overwrite(received, defaults, onto);
      expect(result).toEqual(expectedResult);
    }, 300);
    it('Should not overwrite values in onto when the key does not exist in defaults', () => {
      const received = {
        key1: 'value1',
        key2: 'value2',
      };
      const defaults = {
        key3: 'default3',
        key4: 'default4',
      };
      const onto = {
        key1: 'existingValue',
        key2: 'existingValue',
      };

      const result = overwrite(received, defaults, onto);
      expect(result).toEqual({
        key1: 'existingValue',
        key2: 'existingValue',
      });
    }, 300);
    it('Should return onto object with overwritten values when it is not provided', () => {
      const result = overwrite(received, defaults);
      expect(result).toEqual({
        key1: 'value1',
        key2: 'value2',
      });
    }, 300);
  });
});
