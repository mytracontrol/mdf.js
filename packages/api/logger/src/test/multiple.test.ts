/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Logger } from '../index';
process.env['NODE_ENV'] = 'development';

const mockRegular = () => {
  //@ts-ignore Test environment
  if (console._stdout) {
    //@ts-ignore Test environment
    return jest.spyOn(console._stdout, 'write');
  } else {
    return jest.spyOn(console, 'log');
  }
};

describe('#Logger #constructor', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('#good path', () => {
    it('should create a new logger instance without config and label', done => {
      const loggerNew = new Logger();
      expect(loggerNew instanceof Logger).toBeTruthy();
      expect(loggerNew.hasError).toBeFalsy();
      expect(loggerNew.configError).toBeUndefined();
      expect(loggerNew.stream).toBeDefined();
      done();
    }, 300);
    it('should create a new logger instance with wrong config, as defaultConfig', done => {
      //@ts-ignore
      const loggerNew = new Logger('confError', 3);
      expect(loggerNew.config.console).toEqual({
        enabled: false,
        level: 'info',
      });
      done();
    }, 300);
    it('should work with several logger at the same time', () => {
      const stdout = mockRegular();
      const logger = new Logger('logger', {
        console: {
          enabled: true,
          level: 'silly',
        },
      });
      const newLogger = new Logger('loggerNew', {
        console: {
          enabled: true,
          level: 'silly',
        },
      });
      logger.info('logging');
      newLogger.info('info');
      expect(stdout.mock.calls[0][0]).toMatch(
        /(?=.*logger)(?=.*info)(?=.*00000000-0000-0000-0000-000000000000)(?=.*unknown)(?=.*logging).*/
      );
      expect(stdout.mock.calls[1][0]).toMatch(
        /(?=.*loggerNew)(?=.*info)(?=.*00000000-0000-0000-0000-000000000000)(?=.*unknown)(?=.*info).*/
      );
    }, 300);
    it('should return the working configuration properly', () => {
      const logger = new Logger('logger', {
        console: {
          enabled: true,
          level: 'silly',
        },
      });
      expect(logger.config.console).toEqual({
        enabled: true,
        level: 'silly',
      });
    }, 300);
    it('should not logging without transports', () => {
      const logger = new Logger('noTransportEnabled', {
        console: { enabled: false },
        file: { enabled: false },
        fluentd: { enabled: false },
      });
      const stdout = jest.spyOn(process.stdout, 'write');
      logger.silly('any');
      logger.info('any');
      logger.verbose('any');
      logger.debug('any');
      expect(stdout.mock.calls.length).toEqual(0);
      const stderr = jest.spyOn(process.stderr, 'write');
      logger.error('any');
      logger.warn('any');
      expect(stderr.mock.calls.length).toEqual(0);
    }, 300);
  });
});
