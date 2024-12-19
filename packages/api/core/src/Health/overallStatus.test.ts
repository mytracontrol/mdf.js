/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { overallStatus } from './overallStatus';
import { Checks } from './types';

describe('#overallStatus', () => {
  describe('#Happy path', () => {
    it(`Should return 'pass' if all checks are 'pass'`, () => {
      const checks: Checks = {
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
      const checks: Checks = {
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
      const checks: Checks = {
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

