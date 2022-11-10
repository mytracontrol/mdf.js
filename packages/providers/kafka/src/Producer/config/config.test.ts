/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// *************************************************************************************************
// #region Arrange
import { CONFIG_PROVIDER_BASE_NAME, defaultLogCreator } from '../../Common';
import { defaultConfig } from './default';

// #endregion
// *************************************************************************************************
// #region Redis config
describe(`#Config #${CONFIG_PROVIDER_BASE_NAME.toLocaleUpperCase()} #Producer`, () => {
  describe('#Happy path', () => {
    it(`Should has a default config`, () => {
      expect(defaultConfig).toMatchObject({
        client: {
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
        },
        producer: {
          allowAutoTopicCreation: true,
          idempotent: false,
          maxInFlightRequests: undefined,
          metadataMaxAge: 300000,
          retry: {
            factor: 0.2,
            initialRetryTime: 300,
            maxRetryTime: 30000,
            multiplier: 2,
            retries: 5,
          },
          transactionTimeout: 60000,
          transactionalId: undefined,
        },
      });
    }, 300);
  });
});

// #endregion
