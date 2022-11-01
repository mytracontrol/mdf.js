/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Mytra Control S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Mytra Control S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Mytra Control S.L.
 */

import { coerce } from '@mdf.js/utils';
import { Config } from '../provider';
import { CONFIG_ARTIFACT_ID, reconnectOnError, retryStrategy } from './utils';

// *************************************************************************************************
// #region Environment variables
/** Default REDIS connection host */
const CONFIG_REDIS_HOST = '127.0.0.1';
/** Default REDIS connection port */
const CONFIG_REDIS_PORT = 28910;
/** Default REDIS connection database */
const CONFIG_REDIS_DB = 0;
/** Default REDIS connection password */
const CONFIG_REDIS_PASSWORD = process.env['CONFIG_REDIS_PASSWORD'];
/** Default REDIS connection retry delay factor */
const CONFIG_REDIS_RETRY_DELAY_FACTOR = coerce<number>(
  process.env['CONFIG_REDIS_RETRY_DELAY_FACTOR']
);
/** Default REDIS connection retry delay max*/
const CONFIG_REDIS_RETRY_DELAY_MAX = coerce<number>(process.env['CONFIG_REDIS_RETRY_DELAY_MAX']);
/** Default REDIS connection keepAlive */
const CONFIG_REDIS_KEEPALIVE = coerce<number>(process.env['CONFIG_REDIS_KEEPALIVE']);
/** Default REDIS connection keepAlive */
const CONFIG_REDIS_CONNECTION_TIMEOUT = coerce<number>(
  process.env['CONFIG_REDIS_CONNECTION_TIMEOUT']
);
const CONFIG_REDIS_CHECK_INTERVAL = coerce<number>(process.env['CONFIG_REDIS_CHECK_INTERVAL']);
const CONFIG_REDIS_DISABLE_CHECKS = coerce<boolean>(process.env['CONFIG_REDIS_DISABLE_CHECKS']);

export const envBasedConfig: Config = {
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
  /** Disable Redis checks */
  disableChecks: CONFIG_REDIS_DISABLE_CHECKS,
};
// #endregion
