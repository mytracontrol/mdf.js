/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Factory } from './Factory';
describe('#Faker #package', () => {
  describe('#Happy path', () => {
    it('should be able to create a new instance', () => {
      expect(new Factory()).toBeInstanceOf(Factory);
    });
  });
  describe('#Sad path', () => {});
});
