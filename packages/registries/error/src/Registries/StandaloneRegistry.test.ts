/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// ************************************************************************************************
// #region Component imports
import { Crash } from '@mdf.js/crash';
import { undoMocks } from '@mdf.js/utils';
import { StandaloneRegistry } from '.';
const UUID_FAKE = 'a1e4e76a-8e1a-425c-883d-4d75760f9cee';
// #endregion
// *************************************************************************************************
// #region Our tests
describe('#Register #Registry #Standalone', () => {
  describe('#Happy path', () => {
    afterEach(function () {
      undoMocks();
    });
    it(`Should create a valid instance of a master registry`, () => {
      const registry = new StandaloneRegistry();
      expect(registry).toBeDefined();
      expect(registry.lastUpdate).toBeDefined();
      expect(registry.errors).toEqual([]);
      expect(registry.size).toEqual(0);
      expect(registry.clear.bind(registry)).not.toThrow();
    }, 300);
    it(`Should create a valid instance of a master registry with different options`, () => {
      const registry = new StandaloneRegistry(-1);
      for (let index = 0; index < 101; index++) {
        registry.push(new Crash('test'));
      }
      registry.start();
      registry.stop();
      expect(registry.size).toEqual(100);
      registry.clear();
      expect(registry.size).toEqual(0);
    }, 300);
  });
});
// #endregion
