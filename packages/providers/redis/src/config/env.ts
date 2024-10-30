/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { coerce } from '@mdf.js/utils';
import { Config } from '../provider';
import { CONFIG_ARTIFACT_ID, reconnectOnError, retryStrategy } from './utils';

// *************************************************************************************************
// #region Environment variables

/**
 * REDIS connection host
 * @defaultValue '127.0.0.1'
 */
const CONFIG_REDIS_HOST = process.env['CONFIG_REDIS_HOST'];
/**
 * REDIS connection port
 * @defaultValue 6379
 */
const CONFIG_REDIS_PORT = coerce<number>(process.env['CONFIG_REDIS_PORT']);
/**
 * REDIS connection database
 * @defaultValue 0
 */
const CONFIG_REDIS_DB = coerce<number>(process.env['CONFIG_REDIS_DB']);
/**
 * REDIS connection password
 * @defaultValue undefined
 */
const CONFIG_REDIS_PASSWORD = process.env['CONFIG_REDIS_PASSWORD'];
/**
 * REDIS connection retry delay factor
 * @defaultValue 2000
 */
const CONFIG_REDIS_RETRY_DELAY_FACTOR = coerce<number>(
  process.env['CONFIG_REDIS_RETRY_DELAY_FACTOR']
);
/**
 * REDIS connection retry delay max
 * @defaultValue 60000
 */
const CONFIG_REDIS_RETRY_DELAY_MAX = coerce<number>(process.env['CONFIG_REDIS_RETRY_DELAY_MAX']);
/**
 * REDIS connection keepAlive
 * @defaultValue 10000
 */
const CONFIG_REDIS_KEEPALIVE = coerce<number>(process.env['CONFIG_REDIS_KEEPALIVE']);
/**
 * REDIS connection keepAlive
 * @defaultValue 10000
 */
const CONFIG_REDIS_CONNECTION_TIMEOUT = coerce<number>(
  process.env['CONFIG_REDIS_CONNECTION_TIMEOUT']
);
/**
 * REDIS status check interval
 * @defaultValue 60000
 */
const CONFIG_REDIS_CHECK_INTERVAL = coerce<number>(process.env['CONFIG_REDIS_CHECK_INTERVAL']);
/**
 * Disable Redis checks
 * @defaultValue false
 */
const CONFIG_REDIS_DISABLE_CHECKS = coerce<boolean>(process.env['CONFIG_REDIS_DISABLE_CHECKS']);

/**
 * Used as default container id, receiver name, sender name, etc. in cluster configurations.
 * @defaultValue undefined
 */
export const NODE_APP_INSTANCE = process.env['NODE_APP_INSTANCE'];

export const envBasedConfig: Config = {
  /** Default Redis instance port */
  port: CONFIG_REDIS_PORT,
  /** Default Redis instance host address */
  host: CONFIG_REDIS_HOST,
  /** Default Redis instance DB */
  db: CONFIG_REDIS_DB,
  /** If set, client will send AUTH command with the value of this option when connected */
  password: CONFIG_REDIS_PASSWORD,
  /** Version of IP stack */
  family: 4,
  /** TCP KeepAlive in ms. Set to a non-number value to disable keepAlive */
  keepAlive: CONFIG_REDIS_KEEPALIVE,
  /** Connection name*/
  connectionName: NODE_APP_INSTANCE ?? CONFIG_ARTIFACT_ID,
  /** Enabled the ready event form Redis instance */
  enableReadyCheck: true,
  /** Enable to send command even when the server is not still ready */
  enableOfflineQueue: true,
  /** Connection timeout in milliseconds */
  connectTimeout: CONFIG_REDIS_CONNECTION_TIMEOUT,
  /** Auto resubscribe to channels in subscribe mode when a reconnection is performed */
  autoResubscribe: true,
  /** Auto resend unfulfilled command when a reconnection is performed */
  autoResendUnfulfilledCommands: true,
  /** By default the connection will not be performed */
  lazyConnect: true,
  /** No key prefix */
  keyPrefix: '',
  /** No readonly protection */
  readOnly: false,
  /** Reconnection retry strategy */
  retryStrategy: retryStrategy(CONFIG_REDIS_RETRY_DELAY_FACTOR, CONFIG_REDIS_RETRY_DELAY_MAX),
  /** Always reconnect in any error */
  reconnectOnError,
  /** Show friendly errors */
  showFriendlyErrorStack: true,
  /** Ready check interval */
  checkInterval: CONFIG_REDIS_CHECK_INTERVAL,
  /** Disable Redis checks */
  disableChecks: CONFIG_REDIS_DISABLE_CHECKS,
};
// #endregion
