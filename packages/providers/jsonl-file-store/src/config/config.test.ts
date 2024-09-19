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
      expect(defaultConfig.writeOptions).toBeDefined();
      expect(defaultConfig.rotationOptions).toBeDefined();
      const writeOptions = defaultConfig.writeOptions;
      const rotationOptions = defaultConfig.rotationOptions;
      expect(writeOptions).toHaveProperty('encoding', 'utf-8');
      expect(writeOptions).toHaveProperty('flag', 'a');
      expect(writeOptions).toHaveProperty('mode', 0o666);
      expect(writeOptions).toHaveProperty('flush', false);
      expect(rotationOptions).toHaveProperty('interval');
      expect(rotationOptions).toHaveProperty('openFilesFolderPath', './data/open');
      expect(rotationOptions).toHaveProperty('closedFilesFolderPath', './data/closed');
      expect(rotationOptions).toHaveProperty('retryOptions');
      const retryOptions = rotationOptions.retryOptions;
      expect(retryOptions).toHaveProperty('attempts', 3);
      expect(retryOptions).toHaveProperty('timeout', 5000);
    }, 1000);
  });
});

// #endregion
