/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// *************************************************************************************************
// #region Arrange
import { defaultConfig } from './default';
// #endregion
// *************************************************************************************************
// #region config
describe(`#Config #jsonl-file-store`, () => {
  describe('#Happy path', () => {
    it(`Should have a default config`, () => {
      expect(defaultConfig).toBeDefined();
      expect(defaultConfig).toHaveProperty('openFilesFolderPath', './data/open');
      expect(defaultConfig).toHaveProperty('closedFilesFolderPath', './data/closed');
      expect(defaultConfig).toHaveProperty('createFolders', true);
      expect(defaultConfig).toHaveProperty('fileEncoding', 'utf-8');
      expect(defaultConfig).toHaveProperty('rotationInterval', 600000);
      expect(defaultConfig).toHaveProperty('failOnStartSetup', true);
      expect(defaultConfig).toHaveProperty('appendRetryOptions');
      expect(defaultConfig.appendRetryOptions).toBeDefined();
      expect(defaultConfig.appendRetryOptions).toHaveProperty('timeout', 5000);
      expect(defaultConfig.appendRetryOptions).toHaveProperty('attempts', 3);
      expect(defaultConfig).toHaveProperty('rotationRetryOptions');
      expect(defaultConfig.rotationRetryOptions).toBeDefined();
      expect(defaultConfig.rotationRetryOptions).toHaveProperty('timeout', 5000);
      expect(defaultConfig.rotationRetryOptions).toHaveProperty('attempts', 3);
    }, 1000);
  });
});

// #endregion
