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
describe(`#Config #jsonl-archiver`, () => {
  describe('#Happy path', () => {
    it(`Should have a default config`, () => {
      expect(defaultConfig).toBeDefined();
      expect(defaultConfig).toHaveProperty('workingFolderPath', './data/working');
      expect(defaultConfig).toHaveProperty('archiveFolderPath', './data/archive');
      expect(defaultConfig).toHaveProperty('createFolders', true);
      expect(defaultConfig).toHaveProperty('fileEncoding', 'utf-8');
      expect(defaultConfig).toHaveProperty('rotationInterval', 600000);
      expect(defaultConfig).toHaveProperty('rotationSize', 10485760);
      expect(defaultConfig).toHaveProperty('rotationLines', 10000);
    }, 1000);
  });
});

// #endregion
