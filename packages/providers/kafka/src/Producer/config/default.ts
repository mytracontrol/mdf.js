/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { defaultConfig as commonDefaultConfig } from '../../Common';
import { Config as ProducerConfig } from '../types';

// *************************************************************************************************
// #region Default values
const KAFKA_PRODUCER__METADATA_MAX_AGE = 300000;
const KAFKA_PRODUCER__ALLOW_AUTO_TOPIC_CREATION = true;
const KAFKA_PRODUCER__IDEMPOTENT = false;
const KAFKA_PRODUCER__TRANSACTIONAL_ID = undefined;
const KAFKA_PRODUCER__TRANSACTION_TIMEOUT = 60000;
const KAFKA_PRODUCER__MAX_IN_FLIGHT_REQUEST = undefined;
const KAFKA_PRODUCER__RETRY__MAX_RETRY_TIME = 30000;
const KAFKA_PRODUCER__RETRY__INITIAL_RETRY_TIME = 300;
const KAFKA_PRODUCER__RETRY__FACTOR = 0.2;
const KAFKA_PRODUCER__RETRY__MULTIPLIER = 2;
const KAFKA_PRODUCER__RETRY__RETRIES = 5;

export const defaultConfig: ProducerConfig = {
  ...commonDefaultConfig,
  producer: {
    metadataMaxAge: KAFKA_PRODUCER__METADATA_MAX_AGE,
    allowAutoTopicCreation: KAFKA_PRODUCER__ALLOW_AUTO_TOPIC_CREATION,
    idempotent: KAFKA_PRODUCER__IDEMPOTENT,
    transactionalId: KAFKA_PRODUCER__TRANSACTIONAL_ID,
    transactionTimeout: KAFKA_PRODUCER__TRANSACTION_TIMEOUT,
    maxInFlightRequests: KAFKA_PRODUCER__MAX_IN_FLIGHT_REQUEST,
    retry: {
      maxRetryTime: KAFKA_PRODUCER__RETRY__MAX_RETRY_TIME,
      initialRetryTime: KAFKA_PRODUCER__RETRY__INITIAL_RETRY_TIME,
      factor: KAFKA_PRODUCER__RETRY__FACTOR,
      multiplier: KAFKA_PRODUCER__RETRY__MULTIPLIER,
      retries: KAFKA_PRODUCER__RETRY__RETRIES,
    },
  },
};
// #endregion

