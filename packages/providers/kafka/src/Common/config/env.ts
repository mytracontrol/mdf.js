/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { coerce, loadFile } from '@mdf.js/utils';
import { SASLMechanismOptions } from 'kafkajs';
import { ConnectionOptions } from 'tls';
import { BaseConfig } from '../types';
import { logger } from './utils';

type AllowedMechanisms = 'plain' | 'scram-sha-256' | 'scram-sha-512' | 'aws' | 'oauthbearer';
// *************************************************************************************************
// #region Environment variables - Kafka Client general configuration
/**
 * Client identifier
 * @defaultValue hostname
 */
const CONFIG_KAFKA_CLIENT__CLIENT_ID = process.env['CONFIG_KAFKA_CLIENT__CLIENT_ID'];
/**
 * Kafka brokers
 * @defaultValue '127.0.0.1:9092'
 */
const CONFIG_KAFKA_CLIENT__BROKERS = process.env['CONFIG_KAFKA_CLIENT__BROKERS']
  ? process.env['CONFIG_KAFKA_CLIENT__BROKERS'].split(',')
  : undefined;
/**
 * Time in milliseconds to wait for a successful connection
 * @defaultValue 1000
 */
const CONFIG_KAFKA_CLIENT__CONNECTION_TIMEOUT = coerce<number>(
  process.env['CONFIG_KAFKA_CLIENT__CONNECTION_TIMEOUT']
);
/**
 * Timeout in ms for authentication requests
 * @defaultValue 1000
 */
const CONFIG_KAFKA_CLIENT__AUTHENTICATION_TIMEOUT = coerce<number>(
  process.env['CONFIG_KAFKA_CLIENT__AUTHENTICATION_TIMEOUT']
);
/**
 * When periodic reauthentication (connections.max.reauth.ms) is configured on the broker side,
 * reauthenticate when `reauthenticationThreshold` milliseconds remain of session lifetime.
 * @defaultValue 1000
 */
const CONFIG_KAFKA_CLIENT__REAUTHENTICATION_THRESHOLD = coerce<number>(
  process.env['CONFIG_KAFKA_CLIENT__REAUTHENTICATION_THRESHOLD']
);
/**
 * Time in milliseconds to wait for a successful request
 * @defaultValue 30000
 */
const CONFIG_KAFKA_CLIENT__REQUEST_TIMEOUT = coerce<number>(
  process.env['CONFIG_KAFKA_CLIENT__REQUEST_TIMEOUT']
);
/**
 * The request timeout can be disabled by setting this value to false.
 * @defaultValue true
 */
const CONFIG_KAFKA_CLIENT__ENFORCE_REQUEST_TIMEOUT = coerce<boolean>(
  process.env['CONFIG_KAFKA_CLIENT__ENFORCE_REQUEST_TIMEOUT']
);
/**
 * Maximum time in milliseconds to wait for a successful retry
 * @defaultValue 30000
 */
const CONFIG_KAFKA_CLIENT__RETRY__MAX_RETRY_TIME = coerce<number>(
  process.env['CONFIG_KAFKA_MAX_RETRY_TIME']
);
/**
 * Initial value used to calculate the retry in milliseconds (This is still randomized following the
 * randomization factor)
 * @defaultValue 300
 */
const CONFIG_KAFKA_CLIENT__RETRY__INITIAL_RETRY_TIME = coerce<number>(
  process.env['CONFIG_KAFKA_INITIAL_RETRY_TIME']
);
/**
 * Randomization factor
 * @defaultValue 0.2
 */
const CONFIG_KAFKA_CLIENT__RETRY__FACTOR = coerce<number>(process.env['CONFIG_KAFKA_RETRY_FACTOR']);
/**
 * Exponential factor
 * @defaultValue 2
 */
const CONFIG_KAFKA_CLIENT__RETRY__MULTIPLIER = coerce<number>(
  process.env['CONFIG_KAFKA_RETRY_MULTIPLIER']
);
/**
 * Maximum number of retries per call
 * @defaultValue 5
 */
const CONFIG_KAFKA_CLIENT__RETRY__RETRIES = coerce<number>(process.env['CONFIG_KAFKA_RETRIES']);
// #endregion
// *************************************************************************************************
// #region Environment variables - Kafka Client security configuration

/**
 * Whether to use SSL
 * @defaultValue false
 */
const CONFIG_KAFKA_CLIENT_SSL_ENABLED = coerce<boolean>(
  process.env['CONFIG_KAFKA_CLIENT_SSL_ENABLED']
);
/**
 * Whether to verify the SSL certificate.
 * @defaultValue true
 */
const CONFIG_KAFKA_CLIENT__SSL__REJECT_UNAUTHORIZED = coerce<boolean>(
  process.env['CONFIG_KAFKA_CLIENT__SSL__REJECT_UNAUTHORIZED']
);
/**
 * Server name for the TLS certificate.
 * @defaultValue undefined
 */
const CONFIG_KAFKA_CLIENT__SSL__SERVER_NAME = process.env['CONFIG_KAFKA_CLIENT__SSL__SERVER_NAME'];

/**
 * Path to the CA certificate.
 * @defaultValue undefined
 */
const CONFIG_KAFKA_CLIENT_SSL_CA_PATH = process.env['CONFIG_KAFKA_CLIENT_SSL_CA_PATH'];
let CA = loadFile(CONFIG_KAFKA_CLIENT_SSL_CA_PATH, logger);
/**
 * Path to the client certificate.
 * @defaultValue undefined
 */
const CONFIG_KAFKA_CLIENT_SSL_CERT_PATH = process.env['CONFIG_KAFKA_CLIENT_SSL_CERT_PATH'];
let CERT = loadFile(CONFIG_KAFKA_CLIENT_SSL_CERT_PATH, logger);
/**
 * Path to the client key.
 * @defaultValue undefined
 */
const CONFIG_KAFKA_CLIENT_SSL_KEY_PATH = process.env['CONFIG_KAFKA_CLIENT_SSL_KEY_PATH'];
let KEY = loadFile(CONFIG_KAFKA_CLIENT_SSL_KEY_PATH, logger);

const isCertTuple = KEY && CERT;

if (!isCertTuple) {
  logger.debug(
    `CERT and KEY must be set to fullfil the configuration and at least one of them is missing`
  );
  KEY = undefined;
  CERT = undefined;
  CA = undefined;
}

const isSSLConfig =
  isCertTuple ||
  CONFIG_KAFKA_CLIENT__SSL__REJECT_UNAUTHORIZED ||
  CONFIG_KAFKA_CLIENT__SSL__SERVER_NAME;

let SSL: ConnectionOptions | undefined = undefined;
if (CONFIG_KAFKA_CLIENT_SSL_ENABLED && isSSLConfig) {
  SSL = {
    ca: CA,
    cert: CERT,
    key: KEY,
    rejectUnauthorized: CONFIG_KAFKA_CLIENT__SSL__REJECT_UNAUTHORIZED,
    servername: CONFIG_KAFKA_CLIENT__SSL__SERVER_NAME,
  };
}
// #endregion
// *************************************************************************************************
// #region Environment variables - Kafka Client authentication configuration

/**
 * SASL mechanism, supported mechanisms are: plain, scram-sha-256, scram-sha-512
 */
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

export const envBasedConfig: BaseConfig = {
  client: {
    brokers: CONFIG_KAFKA_CLIENT__BROKERS as string[],
    ssl: SSL,
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
};
// #endregion

