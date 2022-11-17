/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// *************************************************************************************************
process.env['DEBUG'] = '*myLogger*';
import { Crash } from '@mdf.js/crash';
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
      const logger = new DebugLogger('mdf:myLogger');
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
