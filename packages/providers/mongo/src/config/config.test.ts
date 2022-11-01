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
