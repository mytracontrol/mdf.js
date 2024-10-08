/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { v4 } from 'uuid';
import { FileTransport } from './file';

describe('#File transport', () => {
  describe('#Constructor #good path', () => {
    it('New transport with default parameters - No configuration', () => {
      const file = new FileTransport('label', v4());
      const config = file.config;
      expect(config?.enabled).toBeFalsy();
      expect(config?.filename).toEqual('logs/mdf-app.log');
      expect(config?.json).toBeFalsy();
      expect(config?.level).toEqual('info');
      expect(config?.maxFiles).toEqual(10);
      expect(config?.maxsize).toEqual(10485760);
      expect(config?.zippedArchive).toBeFalsy();
    }, 300);
    it('New transport with default parameters - Some parameters', () => {
      const file = new FileTransport('label', v4(), { enabled: true });
      const config = file.config;
      expect(config?.enabled).toBeTruthy();
      expect(config?.filename).toEqual('logs/mdf-app.log');
      expect(config?.json).toBeFalsy();
      expect(config?.level).toEqual('info');
      expect(config?.maxFiles).toEqual(10);
      expect(config?.maxsize).toEqual(10485760);
      expect(config?.zippedArchive).toBeFalsy();
    }, 300);
    it('New transport with default parameters - wrong parameters', () => {
      // @ts-ignore
      const file = new FileTransport('label', v4(), { enabled: 'wrong_parameter' });
      const config = file.config;
      expect(config).toEqual({
        enabled: false,
        level: 'info',
        filename: 'logs/mdf-app.log',
        maxFiles: 10,
        maxsize: 10485760,
        zippedArchive: false,
        json: false,
      });
    }, 300);
  });
});
