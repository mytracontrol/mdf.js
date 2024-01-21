/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { hostname } from 'os';
import { CONFIG_KAFKA_CLIENT__LOG_LEVEL, defaultLogCreator } from '../../Common';
import { Config as ProducerConfig } from '../types';

// *************************************************************************************************
// #region Default values
const CONFIG_KAFKA_CLIENT__BROKERS = '127.0.0.1:9092';
const CONFIG_KAFKA_CLIENT__SSL = false;
const CONFIG_KAFKA_CLIENT__CLIENT_ID = hostname();
const CONFIG_KAFKA_CLIENT__CONNECTION_TIMEOUT = 1000;
const CONFIG_KAFKA_CLIENT__REQUEST_TIMEOUT = 30000;
const CONFIG_KAFKA_CLIENT__ENFORCE_REQUEST_TIMEOUT = false;

const CONFIG_KAFKA_CLIENT__RETRY__MAX_RETRY_TIME = 30000;
const CONFIG_KAFKA_CLIENT__RETRY__INITIAL_RETRY_TIME = 300;
const CONFIG_KAFKA_CLIENT__RETRY__FACTOR = 0.2;
const CONFIG_KAFKA_CLIENT__RETRY__MULTIPLIER = 2;
const CONFIG_KAFKA_CLIENT__RETRY__RETRIES = Number.MAX_VALUE;

const CONFIG_KAFKA_PRODUCER__METADATA_MAX_AGE = 300000;
const CONFIG_KAFKA_PRODUCER__ALLOW_AUTO_TOPIC_CREATION = true;
const CONFIG_KAFKA_PRODUCER__IDEMPOTENT = false;
const CONFIG_KAFKA_PRODUCER__TRANSACTIONAL_ID = undefined;
const CONFIG_KAFKA_PRODUCER__TRANSACTION_TIMEOUT = 60000;
const CONFIG_KAFKA_PRODUCER__MAX_IN_FLIGHT_REQUEST = undefined;
const CONFIG_KAFKA_PRODUCER__RETRY__MAX_RETRY_TIME = 30000;
const CONFIG_KAFKA_PRODUCER__RETRY__INITIAL_RETRY_TIME = 300;
const CONFIG_KAFKA_PRODUCER__RETRY__FACTOR = 0.2;
const CONFIG_KAFKA_PRODUCER__RETRY__MULTIPLIER = 2;
const CONFIG_KAFKA_PRODUCER__RETRY__RETRIES = 5;

export const defaultConfig: ProducerConfig = {
  client: {
    brokers: CONFIG_KAFKA_CLIENT__BROKERS.split(','),
    ssl: CONFIG_KAFKA_CLIENT__SSL,
    clientId: CONFIG_KAFKA_CLIENT__CLIENT_ID,
    connectionTimeout: CONFIG_KAFKA_CLIENT__CONNECTION_TIMEOUT,
    requestTimeout: CONFIG_KAFKA_CLIENT__REQUEST_TIMEOUT,
    enforceRequestTimeout: CONFIG_KAFKA_CLIENT__ENFORCE_REQUEST_TIMEOUT,
    retry: {
      maxRetryTime: CONFIG_KAFKA_CLIENT__RETRY__MAX_RETRY_TIME,
      initialRetryTime: CONFIG_KAFKA_CLIENT__RETRY__INITIAL_RETRY_TIME,
      factor: CONFIG_KAFKA_CLIENT__RETRY__FACTOR,
      multiplier: CONFIG_KAFKA_CLIENT__RETRY__MULTIPLIER,
      retries: CONFIG_KAFKA_CLIENT__RETRY__RETRIES,
    },
    logLevel: CONFIG_KAFKA_CLIENT__LOG_LEVEL,
    logCreator: defaultLogCreator,
  },
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
// #endregion
