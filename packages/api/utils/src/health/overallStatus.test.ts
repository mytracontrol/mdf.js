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

import { Health } from '@mdf/core';
import { overallStatus } from './overallStatus';

describe('#overallStatus', () => {
  describe('#Happy path', () => {
    it(`Should return 'pass' if all checks are 'pass'`, () => {
      const checks: Health.API.Checks = {
        'test:test': [
          {
            componentId: 'test:test',
            name: 'test',
            status: 'pass',
            message: 'test',
          },
        ],
        'test:test2': [
          {
            componentId: 'test:test2',
            name: 'test2',
            status: 'pass',
            message: 'test2',
          },
        ],
      };
      expect(overallStatus(checks)).toEqual('pass');
    });
    it(`Should return 'fail' if any check is 'fail'`, () => {
      const checks: Health.API.Checks = {
        'test:test': [
          {
            componentId: 'test:test',
            name: 'test',
            status: 'pass',
            message: 'test',
          },
        ],
        'test:test3': [
          {
            componentId: 'test:test31',
            name: 'test31',
            status: 'warn',
            message: 'test31',
          },
          {
            componentId: 'test:test32',
            name: 'test32',
            status: 'pass',
            message: 'test32',
          },
        ],
        'test:test2': [
          {
            componentId: 'test:test21',
            name: 'test21',
            status: 'fail',
            message: 'test21',
          },
          {
            componentId: 'test:test22',
            name: 'test22',
            status: 'pass',
            message: 'test22',
          },
        ],
      };
      expect(overallStatus(checks)).toEqual('fail');
    });
    it(`Should return 'warn' if any check is 'warn'`, () => {
      const checks: Health.API.Checks = {
        'test:test': [
          {
            componentId: 'test:test',
            name: 'test',
            status: 'pass',
            message: 'test',
          },
        ],
        'test:test2': [
          {
            componentId: 'test:test2',
            name: 'test2',
            status: 'warn',
            message: 'test2',
          },
        ],
      };
      expect(overallStatus(checks)).toEqual('warn');
    });
  });
});
