/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
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
