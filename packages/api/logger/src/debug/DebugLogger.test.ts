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
// *************************************************************************************************
process.env['DEBUG'] = '*myLogger*';
import { Crash } from '@mdf/crash';
import { DebugLogger } from '.';
const uuid = '02ef7b85-b88e-4134-b611-4056820cd689';

describe('#DebugLogger #logger', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('#Happy path', () => {
    it(`Should create a new instance of DebugLogger`, () => {
      const stderr = jest.spyOn(process.stderr, 'write');
      const logger = new DebugLogger('myLogger');
      expect(logger).toBeDefined();
      logger.silly('Hello World', uuid, 'debug', { foo: 'bar' });
      logger.debug('Hello World', uuid, 'debug', { foo: 'bar' });
      logger.verbose('Hello World', uuid, 'debug', { foo: 'bar' });
      logger.info('Hello World', uuid, 'debug', { foo: 'bar' });
      logger.warn('Hello World', uuid, 'debug', { foo: 'bar' });
      logger.error('Hello World', uuid, 'debug', { foo: 'bar' });
      logger.crash(new Crash('Hello World', uuid));
      logger.silly('Hello World');
      expect(stderr).toHaveBeenCalled();
      expect(stderr.mock.calls[0][0]).toContain('myLogger:silly');
      expect(stderr.mock.calls[0][0]).toContain('Hello World');
      expect(stderr.mock.calls[1][0]).toContain('myLogger:silly');
      expect(stderr.mock.calls[1][0]).toContain("{ foo: 'bar' }");
      expect(stderr.mock.calls[2][0]).toContain('myLogger:debug');
      expect(stderr.mock.calls[2][0]).toContain('Hello World');
      expect(stderr.mock.calls[3][0]).toContain('myLogger:verbose');
      expect(stderr.mock.calls[3][0]).toContain('Hello World');
      expect(stderr.mock.calls[4][0]).toContain('myLogger:info');
      expect(stderr.mock.calls[4][0]).toContain('Hello World');
      expect(stderr.mock.calls[5][0]).toContain('myLogger:warn');
      expect(stderr.mock.calls[5][0]).toContain('Hello World');
      expect(stderr.mock.calls[6][0]).toContain('myLogger:error');
      expect(stderr.mock.calls[6][0]).toContain('Hello World');
      expect(stderr.mock.calls[7][0]).toContain('myLogger:error');
      expect(stderr.mock.calls[7][0]).toContain('CrashError: Hello World');
      expect(stderr.mock.calls[8][0]).toContain('myLogger:silly');
      expect(stderr.mock.calls[8][0]).toContain('Hello World');
    }, 300);
  });
});
// #endregion
