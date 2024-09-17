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
describe(`#Config #file-system`, () => {
  describe('#Happy path', () => {
    it(`Should has a default config`, () => {
      expect(defaultConfig).toBeDefined();
      expect(defaultConfig.readOptions).toBeDefined();
      expect(defaultConfig.writeOptions).toBeDefined();
      expect(defaultConfig.copyOptions).toBeDefined();
      expect(defaultConfig.readDirOptions).toBeDefined();
      const readOptions = defaultConfig.readOptions;
      const writeOptions = defaultConfig.writeOptions;
      const copyOptions = defaultConfig.copyOptions;
      const readDirOptions = defaultConfig.readDirOptions;
      expect(readOptions).toHaveProperty('encoding', 'utf-8');
      expect(readOptions).toHaveProperty('flag', 'r');
      expect(writeOptions).toHaveProperty('encoding', 'utf-8');
      expect(writeOptions).toHaveProperty('flag', 'a');
      expect(writeOptions).toHaveProperty('mode', 0o666);
      expect(writeOptions).toHaveProperty('flush', false);
      expect(copyOptions).toHaveProperty('mode', 1);
      expect(readDirOptions).toHaveProperty('encoding', 'utf8');
      expect(readDirOptions).toHaveProperty('recursive', false);
    }, 1000);
  });
});

// #endregion
