/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Config } from '../types';
import { CONFIG_ARTIFACT_ID } from './utils';

// *************************************************************************************************
// #region Default values

/**
 * Used as default container id, receiver name, sender name, etc. in cluster configurations.
 * @defaultValue undefined
 */
export const NODE_APP_INSTANCE = process.env['NODE_APP_INSTANCE'];

const DEFAULT_CONFIG_AMQP_USER_NAME = 'mdf-amqp';
const DEFAULT_CONFIG_AMQP_HOST = '127.0.0.1';
const DEFAULT_CONFIG_AMQP_PORT = 5672;
const DEFAULT_CONFIG_AMQP_TRANSPORT = 'tcp';
const DEFAULT_CONFIG_AMQP_CONTAINER_ID = NODE_APP_INSTANCE ?? CONFIG_ARTIFACT_ID;
const DEFAULT_CONFIG_AMQP_RECONNECT = 5000;
const DEFAULT_CONFIG_AMQP_INITIAL_RECONNECT_DELAY = 30000;
const DEFAULT_CONFIG_AMQP_MAX_RECONNECT_DELAY = 10000;
const DEFAULT_CONFIG_AMQP_NON_FATAL_ERRORS = ['amqp:connection:forced'];

const DEFAULT_CONFIG_IDLE_TIME_OUT = 5000;
const DEFAULT_RECONNECT_LIMIT = Number.MAX_SAFE_INTEGER;
const DEFAULT_KEEP_ALIVE = true;
const DEFAULT_KEEP_ALIVE_INITIAL_DELAY = 2000;
const DEFAULT_TIMEOUT = 10000;
const DEFAULT_ALL_ERRORS_NON_FATAL = true;

export const defaultConfig: Config = {
  username: DEFAULT_CONFIG_AMQP_USER_NAME,
  host: DEFAULT_CONFIG_AMQP_HOST,
  port: DEFAULT_CONFIG_AMQP_PORT,
  transport: DEFAULT_CONFIG_AMQP_TRANSPORT,
  container_id: DEFAULT_CONFIG_AMQP_CONTAINER_ID,
  reconnect: DEFAULT_CONFIG_AMQP_RECONNECT,
  initial_reconnect_delay: DEFAULT_CONFIG_AMQP_INITIAL_RECONNECT_DELAY,
  max_reconnect_delay: DEFAULT_CONFIG_AMQP_MAX_RECONNECT_DELAY,
  non_fatal_errors: DEFAULT_CONFIG_AMQP_NON_FATAL_ERRORS,
  idle_time_out: DEFAULT_CONFIG_IDLE_TIME_OUT,
  reconnect_limit: DEFAULT_RECONNECT_LIMIT,
  keepAlive: DEFAULT_KEEP_ALIVE,
  keepAliveInitialDelay: DEFAULT_KEEP_ALIVE_INITIAL_DELAY,
  timeout: DEFAULT_TIMEOUT,
  all_errors_non_fatal: DEFAULT_ALL_ERRORS_NON_FATAL,
};
// #endregion

