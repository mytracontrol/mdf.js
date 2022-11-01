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
// #region Arrange
import { defaultConfig } from './default';
import { checkConfigObject, CONFIG_PROVIDER_BASE_NAME, selectAuth } from './utils';
// #endregion
// *************************************************************************************************
// #region HTTP config
describe(`#Config #${CONFIG_PROVIDER_BASE_NAME.toLocaleUpperCase()}`, () => {
  describe('#Happy path', () => {
    it(`Should has a default config`, () => {
      expect(defaultConfig).toMatchObject({});
    }, 300);
    it(`Should return undefined if all the properties of the object are undefined and the object in any other case`, () => {
      expect(checkConfigObject({})).toBeUndefined();
      expect(checkConfigObject({ a: undefined })).toBeUndefined();
      expect(checkConfigObject({ a: undefined, b: undefined })).toBeUndefined();
      expect(checkConfigObject({ a: undefined, b: 'a' })).toEqual({ a: undefined, b: 'a' });
      expect(checkConfigObject('hi')).toBeUndefined();
    });
    it(`Should return auth, only if username and password are configured`, () => {
      expect(selectAuth()).toBeUndefined();
      expect(selectAuth('a')).toBeUndefined();
      expect(selectAuth(undefined, 'b')).toBeUndefined();
      expect(selectAuth('a', 'b')).toMatchObject({ username: 'a', password: 'b' });
    }, 300);
  });
});

// #endregion
