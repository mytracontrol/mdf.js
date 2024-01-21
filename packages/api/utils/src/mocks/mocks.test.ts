/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { mockProperty, undoMockProperty, undoMocks } from './mocks';

describe('#mockProperties', () => {
  describe('#Happy path', () => {
    it('Should mock property', () => {
      const obj = {
        test: 'test',
      };
      mockProperty(obj, 'test', 'mocked');
      expect(obj.test).toEqual('mocked');
    });
    it(`Shouldn't mock property if not exist`, () => {
      const obj = {
        test: 'test',
      };
      function mock() {
        mockProperty(obj, 'test2' as any, 'mocked');
      }
      expect(mock).toThrowError('Property test2 does not exist in object');
    });
    it('Should unMock property', () => {
      const obj = {
        test: 'test',
        test2: 'test2',
      };
      mockProperty(obj, 'test', 'mocked');
      mockProperty(obj, 'test2', 'mocked2');
      expect(obj.test).toEqual('mocked');
      expect(obj.test2).toEqual('mocked2');
      undoMockProperty(obj, 'test');
      expect(obj.test).toEqual('test');
      expect(obj.test2).toEqual('mocked2');
    });
    it('Should unMock all property', () => {
      const obj = {
        test: 'test',
        test2: 'test2',
      };
      mockProperty(obj, 'test', 'mocked');
      mockProperty(obj, 'test2', 'mocked2');
      expect(obj.test).toEqual('mocked');
      expect(obj.test2).toEqual('mocked2');
      undoMocks();
      expect(obj.test).toEqual('test');
      expect(obj.test2).toEqual('test2');
    });
  });
});
