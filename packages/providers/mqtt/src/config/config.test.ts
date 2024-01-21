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
// #region Redis config
describe(`#Config #${CONFIG_PROVIDER_BASE_NAME.toLocaleUpperCase()}`, () => {
  describe('#Happy path', () => {
    it(`Should has a default config`, () => {
      expect(defaultConfig).toMatchObject({
        url: 'mqtt://localhost:1883',
        protocol: 'mqtt',
        clientId: `mdf-${CONFIG_PROVIDER_BASE_NAME}`,
        keepalive: 60,
      });
    }, 300);
  });
});

// #endregion
