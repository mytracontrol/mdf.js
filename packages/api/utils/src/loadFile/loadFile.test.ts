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
