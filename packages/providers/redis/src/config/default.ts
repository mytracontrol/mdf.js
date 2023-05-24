/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Config } from '../provider';
import { CONFIG_ARTIFACT_ID, reconnectOnError, retryStrategy } from './utils';

// *************************************************************************************************
// #region Default values
/** Default REDIS connection host */
const CONFIG_REDIS_HOST = '127.0.0.1';
/** Default REDIS connection port */
const CONFIG_REDIS_PORT = 6379;
/** Default REDIS connection database */
const CONFIG_REDIS_DB = 0;
/** Default REDIS connection password */
const CONFIG_REDIS_PASSWORD = undefined;
/** Default REDIS connection retry delay factor */
export const CONFIG_REDIS_RETRY_DELAY_FACTOR = 2000;
/** Default REDIS connection retry delay max*/
export const CONFIG_REDIS_RETRY_DELAY_MAX = 60000;
/** Default REDIS connection keepAlive */
const CONFIG_REDIS_KEEPALIVE = 10000;
/** Default REDIS connection keepAlive */
const CONFIG_REDIS_CONNECTION_TIMEOUT = 10000;
/** Default REDIS check interval */
const CONFIG_REDIS_CHECK_INTERVAL = 60000;
/** Default REDIS disable checks */
const CONFIG_REDIS_DISABLE_CHECKS = false;

export const defaultConfig: Config = {
  /** Default Netin Redis instance port */
  port: CONFIG_REDIS_PORT,
  /** Default Netin Redis instance host address */
  host: CONFIG_REDIS_HOST,
  /** Default Netin Redis instance DB */
  db: CONFIG_REDIS_DB,
  /** If set, client will send AUTH command with the value of this option when connected */
  password: CONFIG_REDIS_PASSWORD,
  /** Version of IP stack */
  family: 4,
  /** TCP KeepAlive in ms. Set to a non-number value to disable keepAlive */
  keepAlive: CONFIG_REDIS_KEEPALIVE,
  /** Connection name*/
  connectionName: CONFIG_ARTIFACT_ID,
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
  /** Disable checks */
  disableChecks: CONFIG_REDIS_DISABLE_CHECKS,
};
// #endregion
