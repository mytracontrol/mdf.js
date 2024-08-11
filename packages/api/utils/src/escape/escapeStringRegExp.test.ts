/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// *************************************************************************************************
// #region Mocha, chai and sinon imports (Testing engine)
import { escapeRegExp } from './escapeStringRegexp';
// #endregion
describe('#SafeTypes #RegexEscapeExp', () => {
  describe('#Happy path', () => {
    it('Should pass the test if a regex is escaped', () => {
      expect(escapeRegExp(/^[a-zA-Z0-9]{32}$/)).toEqual('^[a-zA-Z0-9]{32}$');
    });
  });
  describe('#Sad path', () => {
    it('Should pass the test throw an error', () => {
      const test = () => {
        //@ts-ignore Test environment
        escapeRegExp('-');
      };
      expect(test).toThrowError('Expected a RegExp');
    });
  });
});
