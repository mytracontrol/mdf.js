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
