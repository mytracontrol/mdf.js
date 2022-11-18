/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { defaultConfig } from './default';
import { CONFIG_ARTIFACT_ID, CONFIG_PROVIDER_BASE_NAME } from './utils';

describe(`#Config #${CONFIG_PROVIDER_BASE_NAME.toLocaleUpperCase()}`, () => {
  describe('#Happy path', () => {
    it(`Should has a default config`, () => {
      expect(defaultConfig).toMatchObject({
        url: 'mongodb://127.0.0.1:27017',
        appName: CONFIG_ARTIFACT_ID,
        serverSelectionTimeoutMS: 10000,
        keepAlive: true,
        keepAliveInitialDelay: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 10000,
        minPoolSize: 4,
        directConnection: false,
        family: 4,
      });
    }, 300);
  });
});

// #endregion
