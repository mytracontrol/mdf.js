/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { BottleneckError } from '.';

describe('#Puller #BottleneckError', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('#Happy path', () => {
    it(`Should create a new instance of BottleneckError`, () => {
      const error = new BottleneckError('Error message');
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(BottleneckError);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Error message');
    });
  });
});
