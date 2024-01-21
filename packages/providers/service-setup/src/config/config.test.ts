/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// *************************************************************************************************
// #region Arrange
import { defaultConfig } from './default';
import { CONFIG_ARTIFACT_ID, CONFIG_PROVIDER_BASE_NAME } from './utils';
// #endregion
// *************************************************************************************************
// #region Redis config
describe(`#Config #${CONFIG_PROVIDER_BASE_NAME.toLocaleUpperCase()}`, () => {
  describe('#Happy path', () => {
    it(`Should has a default config`, () => {
      expect(defaultConfig).toBeDefined();
      expect(defaultConfig.configFiles).toBeDefined();
      expect(defaultConfig.schemaFiles).toBeDefined();
      expect(defaultConfig.presetFiles).toBeDefined();
      const configFiles = defaultConfig.configFiles as string[];
      const schemaFiles = defaultConfig.schemaFiles as string[];
      const presetFiles = defaultConfig.presetFiles as string[];
      expect(configFiles).toHaveLength(1);
      expect(schemaFiles).toHaveLength(1);
      expect(presetFiles).toHaveLength(1);
      expect(configFiles[0]).toContain('/config/*.*');
      expect(schemaFiles[0]).toContain('/config/schemas/*.*');
      expect(presetFiles[0]).toContain('/config/presets/*.*');
      expect(defaultConfig.name).toBe(CONFIG_ARTIFACT_ID);
    }, 1000);
  });
});

// #endregion
