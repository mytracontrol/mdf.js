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
import { FileTransport } from './file';

describe('#File transport', () => {
  describe('#Constructor #good path', () => {
    it('New transport with default parameters - No configuration', () => {
      const file = new FileTransport('label', v4());
      const config = file.config;
      expect(config?.enabled).toBeFalsy();
      expect(config?.filename).toEqual('logs/mms-app.log');
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
      expect(config?.filename).toEqual('logs/mms-app.log');
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
        filename: 'logs/mms-app.log',
        maxFiles: 10,
        maxsize: 10485760,
        zippedArchive: false,
        json: false,
      });
    }, 300);
  });
});
