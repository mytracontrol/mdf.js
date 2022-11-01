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
import logger from '../index';
import { FluentdTransport } from './fluentd';

describe('#Fluentd transport', () => {
  describe('#Constructor #good path', () => {
    it('New transport with default parameters - No configuration', () => {
      const fluentd = new FluentdTransport('label', logger, v4());
      expect(fluentd.config?.enabled).toBeFalsy();
      expect(fluentd.config?.level).toEqual('info');
      expect(fluentd.config?.host).toEqual('localhost');
      expect(fluentd.config?.port).toEqual(28930);
      expect(fluentd.config?.timeout).toEqual(5000);
      expect(fluentd.config?.requireAckResponse).toBeTruthy();
      expect(fluentd.config?.eventMode).toEqual('Message');
      expect(fluentd.config?.reconnectInterval).toEqual(5000);
      expect(fluentd.config?.tls).toBeFalsy();
      expect(fluentd.transport).toBeDefined();
    }, 300);
    it('New transport with default parameters - Some parameters', () => {
      const fluentd = new FluentdTransport('label', logger, v4(), {
        enabled: true,
        host: '127.0.0.1',
        port: 24524,
      });
      const config = fluentd.config;
      expect(config?.enabled).toBeTruthy();
      expect(config?.level).toEqual('info');
      expect(config?.host).toEqual('127.0.0.1');
      expect(config?.port).toEqual(24524);
      expect(config?.timeout).toEqual(5000);
      expect(config?.requireAckResponse).toBeTruthy();
      expect(config?.eventMode).toEqual('Message');
      expect(config?.reconnectInterval).toEqual(5000);
      expect(config?.tls).toBeFalsy();
    }, 300);
    it('New transport with default parameters - wrong parameters', () => {
      const fluentd = new FluentdTransport('label', logger, v4(), {
        // @ts-ignore
        enabled: 'wrong_parameter',
        host: 'localhost',
        port: 24224,
      });
      const config = fluentd.config;
      expect(config).toEqual({
        enabled: false,
        level: 'info',
        host: 'localhost',
        port: 28930,
        timeout: 5000,
        reconnectInterval: 5000,
        requireAckResponse: true,
        eventMode: 'Message',
        flushInterval: 2000,
        sendQueueSizeLimit: 104857600,
        tls: false,
      });
    }, 300);
    it('New transport with tls true without tlsOptions', () => {
      const fluentd = new FluentdTransport('label', logger, v4(), {
        enabled: true,
        host: 'localhost',
        port: 24224,
        tls: true,
      });
      expect(fluentd.config.tls).toEqual(false);
    }, 300);
  });
});
