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
