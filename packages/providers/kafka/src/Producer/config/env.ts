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
/**
 * Maximum time in ms that the producer will wait for metadata
 * @defaultValue 300000
 */
const CONFIG_KAFKA_PRODUCER__METADATA_MAX_AGE = coerce<number>(
  process.env['CONFIG_KAFKA_PRODUCER__METADATA_MAX_AGE']
);
/**
 * Allow auto topic creation
 * @defaultValue true
 */
const CONFIG_KAFKA_PRODUCER__ALLOW_AUTO_TOPIC_CREATION = coerce<boolean>(
  process.env['CONFIG_KAFKA_PRODUCER__ALLOW_AUTO_TOPIC_CREATION']
);
/**
 * Transaction timeout in ms
 * @defaultValue 60000
 */
const CONFIG_KAFKA_PRODUCER__TRANSACTION_TIMEOUT = coerce<number>(
  process.env['CONFIG_KAFKA_PRODUCER__TRANSACTION_TIMEOUT']
);
/**
 * Idempotent producer
 * @defaultValue false
 */
const CONFIG_KAFKA_PRODUCER__IDEMPOTENT = coerce<boolean>(
  process.env['CONFIG_KAFKA_PRODUCER__IDEMPOTENT']
);
/**
 * Transactional id
 * @defaultValue undefined
 */
const CONFIG_KAFKA_PRODUCER__TRANSACTIONAL_ID =
  process.env['CONFIG_KAFKA_PRODUCER__TRANSACTIONAL_ID'];
/**
 * Maximum number of in-flight requests
 * @defaultValue undefined
 */
const CONFIG_KAFKA_PRODUCER__MAX_IN_FLIGHT_REQUEST = coerce<number>(
  process.env['CONFIG_KAFKA_PRODUCER__MAX_IN_FLIGHT_REQUEST']
);
/**
 * Maximum time in ms that the producer will wait for metadata
 * @defaultValue 300000
 */
const CONFIG_KAFKA_PRODUCER__RETRY__MAX_RETRY_TIME = coerce<number>(
  process.env['CONFIG_KAFKA_PRODUCER__RETRY__MAX_RETRY_TIME']
);
/**
 * Initial value used to calculate the retry in milliseconds (This is still randomized following the randomization factor)
 * @defaultValue 300
 */
const CONFIG_KAFKA_PRODUCER__RETRY__INITIAL_RETRY_TIME = coerce<number>(
  process.env['CONFIG_KAFKA_PRODUCER__RETRY__INITIAL_RETRY_TIME']
);
/**
 * A multiplier to apply to the retry time
 * @defaultValue 0.2
 */
const CONFIG_KAFKA_PRODUCER__RETRY__FACTOR = coerce<number>(
  process.env['CONFIG_KAFKA_PRODUCER__RETRY__FACTOR']
);
/**
 * A multiplier to apply to the retry time
 * @defaultValue 2
 */
const CONFIG_KAFKA_PRODUCER__RETRY__MULTIPLIER = coerce<number>(
  process.env['CONFIG_KAFKA_PRODUCER__RETRY__MULTIPLIER']
);
/**
 * Maximum number of retries per call
 * @defaultValue 5
 */
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
