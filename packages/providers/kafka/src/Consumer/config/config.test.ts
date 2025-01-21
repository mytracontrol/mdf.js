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
describe(`#Config #${CONFIG_PROVIDER_BASE_NAME.toLocaleUpperCase()} #Consumer`, () => {
  describe('#Happy path', () => {
    it(`Should has a default config`, () => {
      expect(defaultConfig).toMatchObject({
        client: {
          kafkaJS: {
            brokers: ['127.0.0.1:9092'],
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
            ssl: false,
          },
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
            initialRetryTime: 300,
            maxRetryTime: 30000,
            retries: 5,
          },
          fromBeginning: true,
          autoCommit: false,
        },
      });
    }, 300);
  });
});

// #endregion
