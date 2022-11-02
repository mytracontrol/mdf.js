/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// *************************************************************************************************
// #region Arrange
import { ReplyError } from 'redis-errors';
import {
  CONFIG_REDIS_RETRY_DELAY_FACTOR,
  CONFIG_REDIS_RETRY_DELAY_MAX,
  defaultConfig,
} from './default';
import { CONFIG_PROVIDER_BASE_NAME, reconnectOnError, retryStrategy } from './utils';
// #endregion
// *************************************************************************************************
// #region Redis config
describe(`#Config #${CONFIG_PROVIDER_BASE_NAME.toLocaleUpperCase()}`, () => {
  describe('#Happy path', () => {
    it(`Should reconnect if the error is not 'ERR invalid password'`, () => {
      expect(reconnectOnError(new ReplyError('ERR invalid password'))).toEqual(false);
      expect(reconnectOnError(new ReplyError('other'))).toEqual(true);
    }, 300);
    it(`The retry strategy should return the min of "times * delayFactor" or "maxDelay"'`, () => {
      expect(
        //@ts-ignore
        retryStrategy(CONFIG_REDIS_RETRY_DELAY_FACTOR, CONFIG_REDIS_RETRY_DELAY_MAX)(1)
        //@ts-ignore
      ).toEqual(CONFIG_REDIS_RETRY_DELAY_FACTOR);
      expect(
        //@ts-ignore
        retryStrategy(CONFIG_REDIS_RETRY_DELAY_FACTOR, CONFIG_REDIS_RETRY_DELAY_MAX)(100)
        //@ts-ignore
      ).toEqual(CONFIG_REDIS_RETRY_DELAY_MAX);
    }, 300);
    it(`The retry strategy should return undefined if delayFactor or maxDelay are not defined'`, () => {
      expect(
        //@ts-ignore
        retryStrategy(undefined, CONFIG_REDIS_RETRY_DELAY_MAX)
        //@ts-ignore
      ).toBeUndefined();
      expect(
        //@ts-ignore
        retryStrategy(CONFIG_REDIS_RETRY_DELAY_FACTOR, undefined)
        //@ts-ignore
      ).toBeUndefined();
      expect(
        //@ts-ignore
        retryStrategy(undefined, undefined)
        //@ts-ignore
      ).toBeUndefined();
    }, 300);
    it(`Should has a default config`, () => {
      expect(defaultConfig).toMatchObject({
        autoResendUnfulfilledCommands: true,
        autoResubscribe: true,
        connectTimeout: 10000,
        connectionName: 'mdf-redis',
        db: 0,
        enableOfflineQueue: true,
        enableReadyCheck: true,
        family: 4,
        host: '127.0.0.1',
        keepAlive: 10000,
        keyPrefix: '',
        lazyConnect: true,
        password: undefined,
        port: 28910,
        readOnly: false,
        showFriendlyErrorStack: true,
        reconnectOnError,
      });
    }, 300);
  });
});

// #endregion
