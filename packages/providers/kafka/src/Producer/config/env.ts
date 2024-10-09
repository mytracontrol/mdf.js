/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { coerce } from '@mdf.js/utils';
import { envBasedConfig as commonEnvBaseConfig } from '../../Common';
import { Config as ProducerConfig } from '../types';

// *************************************************************************************************
// #region Environment variables - Kafka Producer general configuration
const CONFIG_KAFKA_PRODUCER__METADATA_MAX_AGE = coerce<number>(
  process.env['CONFIG_KAFKA_PRODUCER__METADATA_MAX_AGE']
);
const CONFIG_KAFKA_PRODUCER__ALLOW_AUTO_TOPIC_CREATION = coerce<boolean>(
  process.env['CONFIG_KAFKA_PRODUCER__ALLOW_AUTO_TOPIC_CREATION']
);
const CONFIG_KAFKA_PRODUCER__TRANSACTION_TIMEOUT = coerce<number>(
  process.env['CONFIG_KAFKA_PRODUCER__TRANSACTION_TIMEOUT']
);
const CONFIG_KAFKA_PRODUCER__IDEMPOTENT = coerce<boolean>(
  process.env['CONFIG_KAFKA_PRODUCER__IDEMPOTENT']
);
const CONFIG_KAFKA_PRODUCER__TRANSACTIONAL_ID =
  process.env['CONFIG_KAFKA_PRODUCER__TRANSACTIONAL_ID'];
const CONFIG_KAFKA_PRODUCER__MAX_IN_FLIGHT_REQUEST = coerce<number>(
  process.env['CONFIG_KAFKA_PRODUCER__MAX_IN_FLIGHT_REQUEST']
);
const CONFIG_KAFKA_PRODUCER__RETRY__MAX_RETRY_TIME = coerce<number>(
  process.env['CONFIG_KAFKA_PRODUCER__RETRY__MAX_RETRY_TIME']
);
const CONFIG_KAFKA_PRODUCER__RETRY__INITIAL_RETRY_TIME = coerce<number>(
  process.env['CONFIG_KAFKA_PRODUCER__RETRY__INITIAL_RETRY_TIME']
);
const CONFIG_KAFKA_PRODUCER__RETRY__FACTOR = coerce<number>(
  process.env['CONFIG_KAFKA_PRODUCER__RETRY__FACTOR']
);
const CONFIG_KAFKA_PRODUCER__RETRY__MULTIPLIER = coerce<number>(
  process.env['CONFIG_KAFKA_PRODUCER__RETRY__MULTIPLIER']
);
const CONFIG_KAFKA_PRODUCER__RETRY__RETRIES = coerce<number>(
  process.env['CONFIG_KAFKA_PRODUCER__RETRY__RETRIES']
);
// #endregion

export const envBasedConfig: ProducerConfig = {
  ...commonEnvBaseConfig,
  producer: {
    metadataMaxAge: CONFIG_KAFKA_PRODUCER__METADATA_MAX_AGE,
    allowAutoTopicCreation: CONFIG_KAFKA_PRODUCER__ALLOW_AUTO_TOPIC_CREATION,
    idempotent: CONFIG_KAFKA_PRODUCER__IDEMPOTENT,
    transactionalId: CONFIG_KAFKA_PRODUCER__TRANSACTIONAL_ID,
    transactionTimeout: CONFIG_KAFKA_PRODUCER__TRANSACTION_TIMEOUT,
    maxInFlightRequests: CONFIG_KAFKA_PRODUCER__MAX_IN_FLIGHT_REQUEST,
    retry: {
      maxRetryTime: CONFIG_KAFKA_PRODUCER__RETRY__MAX_RETRY_TIME,
      initialRetryTime: CONFIG_KAFKA_PRODUCER__RETRY__INITIAL_RETRY_TIME,
      factor: CONFIG_KAFKA_PRODUCER__RETRY__FACTOR,
      multiplier: CONFIG_KAFKA_PRODUCER__RETRY__MULTIPLIER,
      retries: CONFIG_KAFKA_PRODUCER__RETRY__RETRIES,
    },
  },
};

