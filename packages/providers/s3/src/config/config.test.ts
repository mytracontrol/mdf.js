/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// *************************************************************************************************
// #region Arrange
import { CONFIG_PROVIDER_BASE_NAME } from '.';
import { defaultConfig } from './default';
// #endregion
// *************************************************************************************************
// #region S3 config
describe(`#Config #${CONFIG_PROVIDER_BASE_NAME.toLocaleUpperCase()}`, () => {
  describe('#Happy path', () => {
    it(`Should have a default config`, () => {
      expect(defaultConfig).toMatchObject({
        region: 'eu-central-1',
        credentials: {
          accessKeyId: 'MY_ACCESS_KEY_ID',
          secretAccessKey: 'MY_SECRET_ACCESS_KEY',
        },
        serviceId: `mdf-${CONFIG_PROVIDER_BASE_NAME}`,
      });
    }, 300);
  });
});

// #endregion
