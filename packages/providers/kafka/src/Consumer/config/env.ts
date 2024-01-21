/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { coerce, loadFile } from '@mdf.js/utils';
import { SASLMechanismOptions } from 'kafkajs';
import { ConnectionOptions } from 'tls';
import { logger } from '../../Common';
import { Config as ConsumerConfig } from '../types';

type AllowedMechanisms = 'plain' | 'scram-sha-256' | 'scram-sha-512' | undefined;
// *************************************************************************************************
// #region Environment variables - Kafka Client general configuration
const CONFIG_KAFKA_CLIENT__CLIENT_ID = process.env['CONFIG_KAFKA_CLIENT__CLIENT_ID'];
const CONFIG_KAFKA_CLIENT__BROKERS = process.env['CONFIG_KAFKA_CLIENT__BROKERS']
  ? process.env['CONFIG_KAFKA_CLIENT__BROKERS'].split(',')
  : undefined;
const CONFIG_KAFKA_CLIENT__CONNECTION_TIMEOUT = coerce<number>(
  process.env['CONFIG_KAFKA_CLIENT__CONNECTION_TIMEOUT']
);
const CONFIG_KAFKA_CLIENT__AUTHENTICATION_TIMEOUT = coerce<number>(
  process.env['CONFIG_KAFKA_CLIENT__AUTHENTICATION_TIMEOUT']
);
const CONFIG_KAFKA_CLIENT__REAUTHENTICATION_THRESHOLD = coerce<number>(
  process.env['CONFIG_KAFKA_CLIENT__REAUTHENTICATION_THRESHOLD']
);
const CONFIG_KAFKA_CLIENT__REQUEST_TIMEOUT = coerce<number>(
  process.env['CONFIG_KAFKA_CLIENT__REQUEST_TIMEOUT']
);
const CONFIG_KAFKA_CLIENT__ENFORCE_REQUEST_TIMEOUT = coerce<boolean>(
  process.env['CONFIG_KAFKA_CLIENT__ENFORCE_REQUEST_TIMEOUT']
);
const CONFIG_KAFKA_CLIENT__RETRY__MAX_RETRY_TIME = coerce<number>(
  process.env['CONFIG_KAFKA_MAX_RETRY_TIME']
);
const CONFIG_KAFKA_CLIENT__RETRY__INITIAL_RETRY_TIME = coerce<number>(
  process.env['CONFIG_KAFKA_INITIAL_RETRY_TIME']
);
const CONFIG_KAFKA_CLIENT__RETRY__FACTOR = coerce<number>(process.env['CONFIG_KAFKA_RETRY_FACTOR']);
const CONFIG_KAFKA_CLIENT__RETRY__MULTIPLIER = coerce<number>(
  process.env['CONFIG_KAFKA_RETRY_MULTIPLIER']
);
const CONFIG_KAFKA_CLIENT__RETRY__RETRIES = coerce<number>(process.env['CONFIG_KAFKA_RETRIES']);
// #endregion
// *************************************************************************************************
// #region Environment variables - Kafka Client security configuration
let CONFIG_KAFKA_CLIENT_SSL: ConnectionOptions | boolean | undefined = coerce<boolean>(
  process.env['CONFIG_KAFKA_CLIENT_SSL']
);
const CONFIG_KAFKA_CLIENT__SSL__REJECT_UNAUTHORIZED = coerce<boolean>(
  process.env['CONFIG_KAFKA_CLIENT__SSL__REJECT_UNAUTHORIZED']
);
const CONFIG_KAFKA_CLIENT__SSL__SERVER_NAME = process.env['CONFIG_KAFKA_CLIENT__SSL__SERVER_NAME'];

let CONFIG_KAFKA_CLIENT__SSL__CA = loadFile(
  process.env['CONFIG_KAFKA_CLIENT__SSL__CA_PATH'],
  logger
);
let CONFIG_KAFKA_CLIENT__SSL__CERT = loadFile(
  process.env['CONFIG_KAFKA_CLIENT__SSL__CERT_PATH'],
  logger
);
let CONFIG_KAFKA_CLIENT__SSL__KEY = loadFile(
  process.env['CONFIG_KAFKA_CLIENT__SSL__KEY_PATH'],
  logger
);

const isCertTuple = CONFIG_KAFKA_CLIENT__SSL__KEY && CONFIG_KAFKA_CLIENT__SSL__CERT;

if (!isCertTuple) {
  logger.debug(
    `CERT and KEY must be set to fullfil the configuration and at least one of them is missing`
  );
  CONFIG_KAFKA_CLIENT__SSL__KEY = undefined;
  CONFIG_KAFKA_CLIENT__SSL__CERT = undefined;
  CONFIG_KAFKA_CLIENT__SSL__CA = undefined;
}

const isSSLConfig =
  isCertTuple ||
  CONFIG_KAFKA_CLIENT__SSL__REJECT_UNAUTHORIZED ||
  CONFIG_KAFKA_CLIENT__SSL__SERVER_NAME;

if (CONFIG_KAFKA_CLIENT_SSL && isSSLConfig) {
  CONFIG_KAFKA_CLIENT_SSL = {
    ca: CONFIG_KAFKA_CLIENT__SSL__CA,
    cert: CONFIG_KAFKA_CLIENT__SSL__CERT,
    key: CONFIG_KAFKA_CLIENT__SSL__KEY,
    rejectUnauthorized: CONFIG_KAFKA_CLIENT__SSL__REJECT_UNAUTHORIZED,
    servername: CONFIG_KAFKA_CLIENT__SSL__SERVER_NAME,
  };
}
// #endregion
// *************************************************************************************************
// #region Environment variables - Kafka Client authentication configuration
const CONFIG_KAFKA_CLIENT__SASL_MECHANISM = process.env[
  'CONFIG_KAFKA_CLIENT__SASL_MECHANISM'
] as AllowedMechanisms;
const CONFIG_KAFKA_CLIENT__SASL_USERNAME = process.env['CONFIG_KAFKA_CLIENT__SASL_USERNAME'];
const CONFIG_KAFKA_CLIENT__SASL_PASSWORD = process.env['CONFIG_KAFKA_CLIENT__SASL_PASSWORD'];
let CONFIG_KAFKA_CLIENT_SASL:
  | SASLMechanismOptions<'plain' | 'scram-sha-256' | 'scram-sha-512'>
  //| Mechanism
  | undefined = undefined;
if (
  CONFIG_KAFKA_CLIENT__SASL_MECHANISM &&
  CONFIG_KAFKA_CLIENT__SASL_USERNAME &&
  CONFIG_KAFKA_CLIENT__SASL_PASSWORD
) {
  CONFIG_KAFKA_CLIENT_SASL = {
    // @ts-ignore - TS doesn't know that the mechanism is valid
    mechanism: CONFIG_KAFKA_CLIENT__SASL_MECHANISM,
    username: CONFIG_KAFKA_CLIENT__SASL_USERNAME,
    password: CONFIG_KAFKA_CLIENT__SASL_PASSWORD,
  };
}
// #endregion
// *************************************************************************************************
// #region Environment variables - Kafka Consumer general configuration
const CONFIG_KAFKA_CONSUMER__GROUP_ID = process.env['CONFIG_KAFKA_CONSUMER__GROUP_ID'];
const CONFIG_KAFKA_CONSUMER__SESSION_TIMEOUT = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__SESSION_TIMEOUT']
);
const CONFIG_KAFKA_CONSUMER__REBALANCE_TIMEOUT = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__REBALANCE_TIMEOUT']
);
const CONFIG_KAFKA_CONSUMER__HEARTBEAT_INTERVAL = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__HEARTBEAT_INTERVAL']
);
const CONFIG_KAFKA_CONSUMER__METADATA_MAX_AGE = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__METADATA_MAX_AGE']
);
const CONFIG_KAFKA_CONSUMER__ALLOW_AUTO_TOPIC_CREATION = coerce<boolean>(
  process.env['CONFIG_KAFKA_CONSUMER__ALLOW_AUTO_TOPIC_CREATION']
);
const CONFIG_KAFKA_CONSUMER__MAX_BYTES_PER_PARTITION = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__MAX_BYTES_PER_PARTITION']
);
const CONFIG_KAFKA_CONSUMER__MIN_BYTES = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__MIN_BYTES']
);
const CONFIG_KAFKA_CONSUMER__MAX_BYTES = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__MAX_BYTES']
);
const CONFIG_KAFKA_CONSUMER__MAX_WAIT_TIME_IN_MS = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER_MAX_WAIT_TIME_IN_MS']
);
const CONFIG_KAFKA_CONSUMER__RETRY__MAX_RETRY_TIME = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__RETRY__MAX_RETRY_TIME']
);
const CONFIG_KAFKA_CONSUMER__RETRY__INITIAL_RETRY_TIME = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__RETRY__INITIAL_RETRY_TIME']
);
const CONFIG_KAFKA_CONSUMER__RETRY__FACTOR = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__RETRY__FACTOR']
);
const CONFIG_KAFKA_CONSUMER__RETRY__MULTIPLIER = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__RETRY__MULTIPLIER']
);
const CONFIG_KAFKA_CONSUMER__RETRY__RETRIES = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__RETRY__RETRIES']
);
const CONFIG_KAFKA_CONSUMER__READ_UNCOMMITTED = coerce<boolean>(
  process.env['CONFIG_KAFKA_CONSUMER__READ_UNCOMMITTED']
);
const CONFIG_KAFKA_CONSUMER__MAX_IN_FLIGHT_REQUEST = coerce<number>(
  process.env['CONFIG_KAFKA_CONSUMER__MAX_IN_FLIGHT_REQUEST']
);
const CONFIG_KAFKA_CONSUMER__RACK_ID = process.env['CONFIG_KAFKA_CONSUMER__RACK_ID'];
// #endregion

export const envBasedConfig: ConsumerConfig = {
  client: {
    brokers: CONFIG_KAFKA_CLIENT__BROKERS as string[],
    ssl: CONFIG_KAFKA_CLIENT_SSL,
    sasl: CONFIG_KAFKA_CLIENT_SASL,
    clientId: CONFIG_KAFKA_CLIENT__CLIENT_ID,
    connectionTimeout: CONFIG_KAFKA_CLIENT__CONNECTION_TIMEOUT,
    authenticationTimeout: CONFIG_KAFKA_CLIENT__AUTHENTICATION_TIMEOUT,
    reauthenticationThreshold: CONFIG_KAFKA_CLIENT__REAUTHENTICATION_THRESHOLD,
    requestTimeout: CONFIG_KAFKA_CLIENT__REQUEST_TIMEOUT,
    enforceRequestTimeout: CONFIG_KAFKA_CLIENT__ENFORCE_REQUEST_TIMEOUT,
    retry: {
      maxRetryTime: CONFIG_KAFKA_CLIENT__RETRY__MAX_RETRY_TIME,
      initialRetryTime: CONFIG_KAFKA_CLIENT__RETRY__INITIAL_RETRY_TIME,
      factor: CONFIG_KAFKA_CLIENT__RETRY__FACTOR,
      multiplier: CONFIG_KAFKA_CLIENT__RETRY__MULTIPLIER,
      retries: CONFIG_KAFKA_CLIENT__RETRY__RETRIES,
    },
  },
  consumer: {
    groupId: CONFIG_KAFKA_CONSUMER__GROUP_ID as string,
    sessionTimeout: CONFIG_KAFKA_CONSUMER__SESSION_TIMEOUT,
    rebalanceTimeout: CONFIG_KAFKA_CONSUMER__REBALANCE_TIMEOUT,
    heartbeatInterval: CONFIG_KAFKA_CONSUMER__HEARTBEAT_INTERVAL,
    metadataMaxAge: CONFIG_KAFKA_CONSUMER__METADATA_MAX_AGE,
    allowAutoTopicCreation: CONFIG_KAFKA_CONSUMER__ALLOW_AUTO_TOPIC_CREATION,
    maxBytesPerPartition: CONFIG_KAFKA_CONSUMER__MAX_BYTES_PER_PARTITION,
    minBytes: CONFIG_KAFKA_CONSUMER__MIN_BYTES,
    maxBytes: CONFIG_KAFKA_CONSUMER__MAX_BYTES,
    maxWaitTimeInMs: CONFIG_KAFKA_CONSUMER__MAX_WAIT_TIME_IN_MS,
    retry: {
      maxRetryTime: CONFIG_KAFKA_CONSUMER__RETRY__MAX_RETRY_TIME,
      initialRetryTime: CONFIG_KAFKA_CONSUMER__RETRY__INITIAL_RETRY_TIME,
      factor: CONFIG_KAFKA_CONSUMER__RETRY__FACTOR,
      multiplier: CONFIG_KAFKA_CONSUMER__RETRY__MULTIPLIER,
      retries: CONFIG_KAFKA_CONSUMER__RETRY__RETRIES,
    },
    readUncommitted: CONFIG_KAFKA_CONSUMER__READ_UNCOMMITTED,
    maxInFlightRequests: CONFIG_KAFKA_CONSUMER__MAX_IN_FLIGHT_REQUEST,
    rackId: CONFIG_KAFKA_CONSUMER__RACK_ID,
  },
};
