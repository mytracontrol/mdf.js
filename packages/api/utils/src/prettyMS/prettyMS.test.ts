/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { prettyMS } from './prettyMS';

describe('#prettyMS', () => {
  describe('#Happy path', () => {
    it(`Should return '15d 11h 23m 20s' if milliseconds is 1337000000`, () => {
      expect(prettyMS(1337000000)).toEqual('15d 11h 23m 20s');
    });
  });
});
