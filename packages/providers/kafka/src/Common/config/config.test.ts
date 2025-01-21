/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// *************************************************************************************************
// #region Arrange
process.env['CONFIG_KAFKA_LOG_LEVEL'] = 'debug';
import { CONFIG_PROVIDER_BASE_NAME, defaultLogger, logger, selectLogLevel } from './utils';

// #endregion
// *************************************************************************************************
// #region Redis config
describe(`#Config #${CONFIG_PROVIDER_BASE_NAME.toLocaleUpperCase()} #Consumer`, () => {
  describe('#Happy path', () => {
    it(`Should convert properly all the possibilities from regular logger level to kafka logger level`, () => {
      expect(selectLogLevel('error')).toEqual(1);
      expect(selectLogLevel('warn')).toEqual(2);
      expect(selectLogLevel('info')).toEqual(3);
      expect(selectLogLevel('debug')).toEqual(4);
      expect(selectLogLevel('trace')).toEqual(4);
      expect(selectLogLevel('other')).toEqual(0);
    }, 300);
    it(`Should create default logger to be used as kafka logger`, () => {
      const debug = jest.spyOn(logger, 'debug');
      const error = jest.spyOn(logger, 'error');
      const warn = jest.spyOn(logger, 'warn');
      const info = jest.spyOn(logger, 'info');
      const silly = jest.spyOn(logger, 'silly');
      defaultLogger.debug('someMessage', { timestamp: 'someTimestamp' });
      defaultLogger.error('someMessage', { timestamp: 'someTimestamp' });
      defaultLogger.warn('someMessage', { timestamp: 'someTimestamp' });
      defaultLogger.info('someMessage', { timestamp: 'someTimestamp' });
      // defaultLogCreator(logLevel.NOTHING)({
      //   label: 'myLabel',
      //   namespace: 'myNamespace',
      //   level: logLevel.NOTHING,
      //   log: { message: 'someMessage', timestamp: 'someTimestamp' },
      // });
      expect(debug.mock.calls.length).toBe(1);
      expect(debug.mock.calls[0]).toEqual([
        'someMessage',
        debug.mock.calls[0][1],
        'Kafka',
        {
          timestamp: 'someTimestamp',
        },
      ]);
      expect(error.mock.calls.length).toBe(1);
      expect(error.mock.calls[0]).toEqual([
        'someMessage',
        error.mock.calls[0][1],
        'Kafka',
        {
          timestamp: 'someTimestamp',
        },
      ]);
      expect(warn.mock.calls.length).toBe(1);
      expect(warn.mock.calls[0]).toEqual([
        'someMessage',
        warn.mock.calls[0][1],
        'Kafka',
        {
          timestamp: 'someTimestamp',
        },
      ]);
      expect(info.mock.calls.length).toBe(1);
      expect(info.mock.calls[0]).toEqual([
        'someMessage',
        info.mock.calls[0][1],
        'Kafka',
        {
          timestamp: 'someTimestamp',
        },
      ]);
      // expect(silly.mock.calls.length).toBe(1);
      // expect(silly.mock.calls[0]).toEqual([
      //   'myLabel - myNamespace - someMessage',
      //   silly.mock.calls[0][1],
      //   'Kafka',
      //   {
      //     timestamp: 'someTimestamp',
      //   },
      // ]);
    }, 300);
  });
});

// #endregion
