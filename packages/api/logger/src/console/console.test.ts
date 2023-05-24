/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { v4 } from 'uuid';
import { ConsoleTransport } from './console';

describe('#Console transport', () => {
  describe('#Constructor #good path', () => {
    it('New transport with default parameters - No configuration', () => {
      const console = new ConsoleTransport('label', v4());
      const config = console.config;
      expect(config?.enabled).toBeFalsy();
      expect(config?.level).toEqual('info');
    }, 300);
    it('New transport with default parameters - Some parameters', () => {
      const console = new ConsoleTransport('label', v4(), { enabled: true });
      const config = console.config;
      expect(config?.enabled).toBeTruthy();
      expect(config?.level).toEqual('info');
    }, 300);
    it('New transport with default parameters - wrong parameters', () => {
      // @ts-ignore
      const console = new ConsoleTransport('label', v4(), { enabled: 'wrong_parameter' });
      const config = console.config;
      expect(config?.enabled).toBeFalsy();
      expect(config?.level).toEqual('info');
    }, 300);
  });
});
