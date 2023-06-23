/**
 * In this file we implement the unit tests
 * for the Parser file in typescript using jest.
 */

import { load, overwrite } from './Parser';

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
    it('Should load values from received into onto using defaults', () => {
      const onto = {};
      const expectedResult = {
        key1: 'value1',
        key2: 'value2',
        key3: 'default3',
      };

      const result = load(received, defaults, onto);
      expect(result).toEqual(expectedResult);
      expect(onto).toEqual(expectedResult);
    });

    it('Should load values from received into onto using defaults keeping onto already existing values', () => {
      const onto = {
        key0: 'existingValue',
        key1: 'initial1',
      };
      const expectedResult = {
        key0: 'existingValue',
        key1: 'value1',
        key2: 'value2',
        key3: 'default3',
      };

      const result = load(received, defaults, onto);
      expect(result).toEqual(expectedResult);
      expect(onto).toEqual(expectedResult);
    });

    it('Should load all the values when received and defaults are the same', () => {
      const received_default = {
        key1: 'value1',
        key2: 'value2',
      };
      const onto = {
        key0: 'existingValue',
      };
      const expectedResult = {
        key0: 'existingValue',
        key1: 'value1',
        key2: 'value2',
      };

      const result = load(received_default, received_default, onto);
      expect(result).toEqual(expectedResult);
      expect(onto).toEqual(expectedResult);
    });

    it('Should load nothing when defaults is empty', () => {
      const onto = {
        key0: 'existingValue',
      };

      const result = load(received, {}, onto);
      expect(result).toEqual({ key0: 'existingValue' });
      expect(onto).toEqual({ key0: 'existingValue' });
    });

    it('Should return onto object with loaded values when it is not provided', () => {
      const expectedResult = {
        key1: 'value1',
        key2: 'value2',
        key3: 'default3',
      };
      const result = load(received, defaults);
      expect(result).toEqual(expectedResult);
    });

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
    });

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
    });

    it('Should return onto object with overwritten values when it is not provided', () => {
      const result = overwrite(received, defaults);
      expect(result).toEqual({
        key1: 'value1',
        key2: 'value2',
      });
    });
  });
});
