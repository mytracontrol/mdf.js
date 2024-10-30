/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { hostname } from 'os';
import { BaseConfig } from '../types';
import { CONFIG_KAFKA_CLIENT__LOG_LEVEL, defaultLogCreator } from './utils';

// *************************************************************************************************
// #region Default values

/**
 * Used as default container id, receiver name, sender name, etc. in cluster configurations.
 * @defaultValue undefined
 */
export const NODE_APP_INSTANCE = process.env['NODE_APP_INSTANCE'];

const KAFKA_CLIENT__BROKERS = '127.0.0.1:9092';
const KAFKA_CLIENT__SSL = false;
const KAFKA_CLIENT__CLIENT_ID = NODE_APP_INSTANCE ?? hostname();
const KAFKA_CLIENT__CONNECTION_TIMEOUT = 1000;
const KAFKA_CLIENT__REQUEST_TIMEOUT = 30000;
const KAFKA_CLIENT__ENFORCE_REQUEST_TIMEOUT = false;

const KAFKA_CLIENT__RETRY__MAX_RETRY_TIME = 30000;
const KAFKA_CLIENT__RETRY__INITIAL_RETRY_TIME = 300;
const KAFKA_CLIENT__RETRY__FACTOR = 0.2;
const KAFKA_CLIENT__RETRY__MULTIPLIER = 2;
const KAFKA_CLIENT__RETRY__RETRIES = Number.MAX_VALUE;
const logLevel = CONFIG_KAFKA_CLIENT__LOG_LEVEL;
const logCreator = defaultLogCreator;

export const defaultConfig: BaseConfig = {
  client: {
    brokers: KAFKA_CLIENT__BROKERS.split(','),
    ssl: KAFKA_CLIENT__SSL,
    clientId: KAFKA_CLIENT__CLIENT_ID,
    connectionTimeout: KAFKA_CLIENT__CONNECTION_TIMEOUT,
    requestTimeout: KAFKA_CLIENT__REQUEST_TIMEOUT,
    enforceRequestTimeout: KAFKA_CLIENT__ENFORCE_REQUEST_TIMEOUT,
    retry: {
      maxRetryTime: KAFKA_CLIENT__RETRY__MAX_RETRY_TIME,
      initialRetryTime: KAFKA_CLIENT__RETRY__INITIAL_RETRY_TIME,
      factor: KAFKA_CLIENT__RETRY__FACTOR,
      multiplier: KAFKA_CLIENT__RETRY__MULTIPLIER,
      retries: KAFKA_CLIENT__RETRY__RETRIES,
    },
    logLevel,
    logCreator,
  },
};
// #endregion
