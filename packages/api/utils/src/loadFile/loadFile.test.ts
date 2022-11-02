/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { loadFile } from './loadFile';
describe('#loadFile #Utils', () => {
  describe('#Happy path', () => {
    it('Should return undefined if not path is provided the file if exist', () => {
      let logged = false;
      const file = loadFile(undefined, (message: string) => {
        console.log(message);
        logged = true;
      });
      expect(logged).toBeTruthy();
      expect(file).toBeUndefined();
    });
    it('Should read the file if exist', () => {
      const file = loadFile(__dirname + '/test/test.txt', (message: string) => {
        console.log(message);
      });
      expect(file).toBeDefined();
    });
    it('Should NOT read the file if NOT exist', () => {
      let logged = false;
      const file = loadFile(__dirname + '/test/other.txt', (message: string) => {
        console.log(message);
        logged = true;
      });
      expect(logged).toBeTruthy();
      expect(file).toBeUndefined();
    });
  });
});
