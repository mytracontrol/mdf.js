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
