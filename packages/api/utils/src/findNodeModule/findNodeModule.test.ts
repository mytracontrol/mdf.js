/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { findNodeModule } from './findNodeModule';

describe('#findNodeModule', () => {
  describe('#Happy path', () => {
    it('Should find the node module', () => {
      const modulePath = findNodeModule('jest');
      expect(modulePath).toBeDefined();
    });
    it('Should NOT find the node module', () => {
      const modulePath = findNodeModule('another');
      expect(modulePath).toBeUndefined();
    });
  });
});
