/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { Logger } from '../index';
process.env['NODE_ENV'] = 'development';

const uuid = '02ef7b85-b88e-4134-b611-4056820cd689';
const context = 'VERY-LONG-CONTEXT';

//@ts-ignore - Test environment
const logger = new Logger(undefined, {
  console: {
    enabled: true,
    level: 'silly',
  },
});

const mockError = () => {
  //@ts-ignore Test environment
  if (console._stderr) {
    //@ts-ignore Test environment
    return jest.spyOn(console._stderr, 'write');
  } else {
    return jest.spyOn(console, 'error');
  }
};
const mockRegular = () => {
  //@ts-ignore Test environment
  if (console._stdout) {
    //@ts-ignore Test environment
    return jest.spyOn(console._stdout, 'write');
  } else {
    return jest.spyOn(console, 'log');
  }
};
describe('#Logger #console', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('#good path ', () => {
    it('error level - w/o uuid and context', () => {
      const stderr = mockError();
      logger.error('logging');

      expect(stderr).toHaveBeenCalled();
      expect(stderr.mock.calls[0][0]).toContain(
        '| mms-app      | error   | 00000000-0000-0000-0000-000000000000 | unknown      | logging'
      );
      expect(stderr.mock.calls[0][0]).toMatch(/\d{4}-\d{2}-\d{2}T[\d.: ]*Z \|[\d ]*\|\smms-app\s*/);
    }, 300);
    it('error level - w/o uuid and context based on Crash', () => {
      const stderr = mockError();
      logger.crash(
        new Crash('Crash error', uuid, {
          name: 'ExampleName',
          cause: new TypeError('typeError'),
          info: { extra: 'extra' },
        })
      );
      expect(stderr).toHaveBeenCalled();
      expect(stderr.mock.calls[0][0]).toContain(
        '| mms-app      | error   | 02ef7b85-b88e-4134-b611-4056820cd689 | unknown      | Crash error'
      );
      expect(stderr.mock.calls[0][0]).toMatch(/\d{4}-\d{2}-\d{2}T[\d.: ]*Z \|[\d ]*\|\smms-app\s*/);
    }, 300);
    it('warn level - w/o uuid and context', () => {
      const stderr = mockError();
      logger.warn('logging');
      expect(stderr).toHaveBeenCalled();
      expect(stderr.mock.calls[0][0]).toContain(
        '| mms-app      | warn    | 00000000-0000-0000-0000-000000000000 | unknown      | logging'
      );
      expect(stderr.mock.calls[0][0]).toMatch(/\d{4}-\d{2}-\d{2}T[\d.: ]*Z \|[\d ]*\|\smms-app\s*/);
    }, 300);
    it('info level - w/o uuid and context', () => {
      const stdout = mockRegular();
      logger.info('logging');
      expect(stdout).toHaveBeenCalled();
      expect(stdout.mock.calls[0][0]).toContain(
        '| mms-app      | info    | 00000000-0000-0000-0000-000000000000 | unknown      | logging'
      );
      expect(stdout.mock.calls[0][0]).toMatch(/\d{4}-\d{2}-\d{2}T[\d.: ]*Z \|[\d ]*\|\smms-app\s*/);
    }, 300);
    it('verbose level - w/o uuid and context', () => {
      const stdout = mockRegular();
      logger.verbose('logging');
      expect(stdout).toHaveBeenCalled();
      expect(stdout.mock.calls[0][0]).toContain(
        '| mms-app      | verbose | 00000000-0000-0000-0000-000000000000 | unknown      | logging'
      );
      expect(stdout.mock.calls[0][0]).toMatch(/\d{4}-\d{2}-\d{2}T[\d.: ]*Z \|[\d ]*\|\smms-app\s*/);
    }, 300);
    it('debug level - w/o uuid and context', () => {
      const stdout = mockRegular();
      logger.debug('logging');
      expect(stdout).toHaveBeenCalled();
      expect(stdout.mock.calls[0][0]).toContain(
        '| mms-app      | debug   | 00000000-0000-0000-0000-000000000000 | unknown      | logging'
      );
      expect(stdout.mock.calls[0][0]).toMatch(/\d{4}-\d{2}-\d{2}T[\d.: ]*Z \|[\d ]*\|\smms-app\s*/);
    }, 300);
    it('silly level - w/o uuid and context', () => {
      const stdout = mockRegular();
      logger.silly('logging');
      expect(stdout).toHaveBeenCalled();
      expect(stdout.mock.calls[0][0]).toContain(
        '| mms-app      | silly   | 00000000-0000-0000-0000-000000000000 | unknown      | logging'
      );
      expect(stdout.mock.calls[0][0]).toMatch(/\d{4}-\d{2}-\d{2}T[\d.: ]*Z \|[\d ]*\|\smms-app\s*/);
    }, 300);
    it('error level - with uuid and context', () => {
      const stderr = mockError();
      logger.error('logging', uuid, context);
      expect(stderr).toHaveBeenCalled();
      expect(stderr.mock.calls[0][0]).toContain(
        '| mms-app      | error   | 02ef7b85-b88e-4134-b611-4056820cd689 | VERY-LONG-CO | logging'
      );
      expect(stderr.mock.calls[0][0]).toMatch(/\d{4}-\d{2}-\d{2}T[\d.: ]*Z \|[\d ]*\|\smms-app\s*/);
    }, 300);
    it('error level - with uuid and context by Crash', () => {
      const stderr = mockError();
      logger.crash(
        new Crash('Crash error', uuid, {
          name: 'ExampleName',
          cause: new TypeError('typeError'),
          info: { extra: 'extra' },
        }),
        context
      );
      expect(stderr).toHaveBeenCalled();
      expect(stderr.mock.calls[0][0]).toContain(
        '| mms-app      | error   | 02ef7b85-b88e-4134-b611-4056820cd689 | VERY-LONG-CO | Crash error'
      );
      expect(stderr.mock.calls[0][0]).toMatch(/\d{4}-\d{2}-\d{2}T[\d.: ]*Z \|[\d ]*\|\smms-app\s*/);
    }, 300);
    it('warn level - with uuid and context', () => {
      const stderr = mockError();
      logger.warn('logging', uuid, context);
      expect(stderr).toHaveBeenCalled();
      expect(stderr.mock.calls[0][0]).toContain(
        '| mms-app      | warn    | 02ef7b85-b88e-4134-b611-4056820cd689 | VERY-LONG-CO | logging'
      );
    }, 300);
    it('info level - with uuid and context', () => {
      const stdout = mockRegular();
      logger.info('logging', uuid, context);
      expect(stdout).toHaveBeenCalled();
      expect(stdout.mock.calls[0][0]).toContain(
        '| mms-app      | info    | 02ef7b85-b88e-4134-b611-4056820cd689 | VERY-LONG-CO | logging'
      );
      expect(stdout.mock.calls[0][0]).toMatch(/\d{4}-\d{2}-\d{2}T[\d.: ]*Z \|[\d ]*\|\smms-app\s*/);
    }, 300);
    it('verbose level - with uuid and context', () => {
      const stdout = mockRegular();
      logger.verbose('logging', uuid, context);
      expect(stdout).toHaveBeenCalled();
      expect(stdout.mock.calls[0][0]).toContain(
        '| mms-app      | verbose | 02ef7b85-b88e-4134-b611-4056820cd689 | VERY-LONG-CO | logging'
      );
      expect(stdout.mock.calls[0][0]).toMatch(
        /[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9.:\s]*Z |[0-9\s]*|\slogger[\s]*/
      );
    }, 300);
    it('debug level - with uuid and context', () => {
      const stdout = mockRegular();
      logger.debug('logging', uuid, context);
      expect(stdout).toHaveBeenCalled();
      expect(stdout.mock.calls[0][0]).toContain(
        '| mms-app      | debug   | 02ef7b85-b88e-4134-b611-4056820cd689 | VERY-LONG-CO | logging'
      );
      expect(stdout.mock.calls[0][0]).toMatch(/\d{4}-\d{2}-\d{2}T[\d.: ]*Z \|[\d ]*\|\smms-app\s*/);
    });
    it('silly level - with uuid and context', () => {
      const stdout = mockRegular();
      logger.silly('logging', uuid, context);
      expect(stdout).toHaveBeenCalled();
      expect(stdout.mock.calls[0][0]).toContain(
        '| mms-app      | silly   | 02ef7b85-b88e-4134-b611-4056820cd689 | VERY-LONG-CO | logging'
      );
      expect(stdout.mock.calls[0][0]).toMatch(/\d{4}-\d{2}-\d{2}T[\d.: ]*Z \|[\d ]*\|\smms-app\s*/);
    }, 300);
  });
});
