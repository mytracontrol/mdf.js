/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// *************************************************************************************************
// #region Arrange
import { defaultConfig } from './default';
import { CONFIG_PROVIDER_BASE_NAME } from './utils';
// #endregion
// *************************************************************************************************
// #region HTTP config
describe(`#Config #${CONFIG_PROVIDER_BASE_NAME.toLocaleUpperCase()}`, () => {
  describe('#Happy path', () => {
    it(`Should has a default config`, () => {
      expect(defaultConfig).toMatchObject({
        url: 'http://localhost:8080',
        path: `/socket.io`,
        transports: ['websocket'],
      });
    }, 300);
  });
});

// #endregion
