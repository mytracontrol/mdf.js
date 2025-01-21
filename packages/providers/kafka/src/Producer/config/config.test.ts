/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// *************************************************************************************************
// #region Arrange
import { CONFIG_PROVIDER_BASE_NAME } from '../../Common';
import { defaultConfig } from './default';

// #endregion
// *************************************************************************************************
// #region Redis config
describe(`#Config #${CONFIG_PROVIDER_BASE_NAME.toLocaleUpperCase()} #Producer`, () => {
  describe('#Happy path', () => {
    it(`Should has a default config`, () => {
      expect(defaultConfig).toMatchObject({
        client: {
          kafkaJS: {
            clientId: defaultConfig.client.kafkaJS.clientId,
            connectionTimeout: 1000,
            enforceRequestTimeout: false,
            logLevel: 1,
            requestTimeout: 30000,
            retry: {
              initialRetryTime: 300,
              maxRetryTime: 30000,
              retries: 1.7976931348623157e308,
            },
          },
        },
        producer: {
          allowAutoTopicCreation: true,
          idempotent: false,
          maxInFlightRequests: undefined,
          metadataMaxAge: 300000,
          retry: {
            initialRetryTime: 300,
            maxRetryTime: 30000,
            retries: 5,
          },
          transactionTimeout: 60000,
          transactionalId: undefined,
          acks: -1,
          timeout: 5000,
          compression: 'none',
        },
      });
    }, 300);
  });
});

// #endregion
