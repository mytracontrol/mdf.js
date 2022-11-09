/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// *************************************************************************************************
// #region Arrange
import { defaultConfig } from './default';
import {
  CONFIG_PROVIDER_BASE_NAME,
  defaultLogCreator,
  logger,
  logLevel,
  selectLogLevel,
} from './utils';

// #endregion
// *************************************************************************************************
// #region Redis config
describe(`#Config #${CONFIG_PROVIDER_BASE_NAME.toLocaleUpperCase()} #Consumer`, () => {
  describe('#Happy path', () => {
    it(`Should has a default config`, () => {
      expect(defaultConfig).toMatchObject({
        client: {
          brokers: ['127.0.0.1:9092'],
          clientId: 'devCenter',
          connectionTimeout: 1000,
          enforceRequestTimeout: false,
          logCreator: defaultLogCreator,
          logLevel: 1,
          requestTimeout: 30000,
          retry: {
            factor: 0.2,
            initialRetryTime: 300,
            maxRetryTime: 30000,
            multiplier: 2,
            retries: 1.7976931348623157e308,
          },
          ssl: false,
        },
        consumer: {
          allowAutoTopicCreation: true,
          groupId: defaultConfig.consumer.groupId,
          heartbeatInterval: 3000,
          maxBytes: 10485760,
          maxBytesPerPartition: 1048576,
          maxWaitTimeInMs: 5000,
          metadataMaxAge: 300000,
          minBytes: 1,
          readUncommitted: false,
          rebalanceTimeout: 60000,
          retry: {
            factor: 0.2,
            initialRetryTime: 300,
            maxRetryTime: 30000,
            multiplier: 2,
            retries: 5,
          },
        },
      });
    }, 300);
    it(`Should convert properly all the possibilities from regular logger level to kafka logger level`, () => {
      expect(selectLogLevel('error')).toEqual(1);
      expect(selectLogLevel('warn')).toEqual(2);
      expect(selectLogLevel('info')).toEqual(4);
      expect(selectLogLevel('debug')).toEqual(5);
      expect(selectLogLevel('trace')).toEqual(5);
      expect(selectLogLevel('other')).toEqual(0);
    }, 300);
    it(`Should convert properly all the possibilities from regular logger level to kafka logger level`, () => {
      const debug = jest.spyOn(logger, 'debug');
      const error = jest.spyOn(logger, 'error');
      const warn = jest.spyOn(logger, 'warn');
      const info = jest.spyOn(logger, 'info');
      const silly = jest.spyOn(logger, 'silly');
      defaultLogCreator(logLevel.DEBUG)({
        label: 'myLabel',
        namespace: 'myNamespace',
        level: logLevel.DEBUG,
        log: { message: 'someMessage', timestamp: 'someTimestamp' },
      });
      defaultLogCreator(logLevel.ERROR)({
        label: 'myLabel',
        namespace: 'myNamespace',
        level: logLevel.ERROR,
        log: { message: 'someMessage', timestamp: 'someTimestamp' },
      });
      defaultLogCreator(logLevel.WARN)({
        label: 'myLabel',
        namespace: 'myNamespace',
        level: logLevel.WARN,
        log: { message: 'someMessage', timestamp: 'someTimestamp' },
      });
      defaultLogCreator(logLevel.INFO)({
        label: 'myLabel',
        namespace: 'myNamespace',
        level: logLevel.INFO,
        log: { message: 'someMessage', timestamp: 'someTimestamp' },
      });
      defaultLogCreator(logLevel.NOTHING)({
        label: 'myLabel',
        namespace: 'myNamespace',
        level: logLevel.NOTHING,
        log: { message: 'someMessage', timestamp: 'someTimestamp' },
      });
      expect(debug.mock.calls.length).toBe(1);
      expect(error.mock.calls.length).toBe(1);
      expect(warn.mock.calls.length).toBe(1);
      expect(info.mock.calls.length).toBe(1);
      expect(silly.mock.calls.length).toBe(1);
    }, 300);
  });
});

// #endregion
