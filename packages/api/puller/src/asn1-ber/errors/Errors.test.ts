/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { InvalidAsn1Error } from '.';

describe('#Puller #asn1-ber #Errors', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('#Happy path', () => {
    it(`Should create a new instance of InvalidAsn1Error`, () => {
      const error = new InvalidAsn1Error('error message');
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(InvalidAsn1Error);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('InvalidAsn1Error');
      expect(error.message).toBe('error message');
    });
  });
});
