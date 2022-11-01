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
// *************************************************************************************************
// #region Mocha, chai and sinon imports (Testing engine)
import { coerce } from './coerce';
// #endregion
describe('#SafeTypes #Coerce', () => {
  describe('#Happy path', () => {
    it('Should pass the test if a number in string format is return as numeric', () => {
      expect(coerce('2')).toEqual(2);
      expect(coerce('2.2')).toEqual(2.2);
      expect(coerce('2F', 2.2)).toEqual(2.2);
    });
    it('Should pass the test if an object in string format is return as object', () => {
      expect(coerce('{ "a": 2 }')).toEqual({ a: 2 });
      expect(coerce('{ "a":', { a: 2 })).toEqual({ a: 2 });
    });
    it('Should pass the test if an array in string format is return as array', () => {
      expect(coerce('[2,3,"a", 1.2]')).toEqual([2, 3, 'a', 1.2]);
      expect(coerce('[ 2,3":', [2, 3, 'a', 1.2])).toEqual([2, 3, 'a', 1.2]);
    });
    it('Should pass the test if a null in string format is return as null', () => {
      expect(coerce('null')).toEqual(null);
      expect(coerce('NULL')).toEqual(null);
    });
    it('Should pass the test if a boolean in string format is return as boolean', () => {
      expect(coerce('true')).toEqual(true);
      expect(coerce('false')).toEqual(false);
      expect(coerce('TRUE')).toEqual(true);
      expect(coerce('FALSE')).toEqual(false);
    });
    it('Should pass the test if return the default value when the value is undefined', () => {
      expect(coerce(undefined, 2)).toEqual(2);
    });
    it(`Should pass the test if return the default value when the value is not possible to coerce`, () => {
      expect(coerce('NoCoerce', 2)).toEqual(2);
    });
  });
});
