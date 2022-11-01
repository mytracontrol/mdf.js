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

import { coerce, loadFile } from '@mdf/utils';
import { CreateAxiosDefaults as RequestDefaults } from 'axios';
import { AgentOptions as HTTPAgentOptions } from 'http';
import { AgentOptions as HTTPSAgentOptions } from 'https';
import { Config } from '../provider';
import { checkConfigObject, logger, selectAuth } from './utils';

// *************************************************************************************************
// #region Environment variables
const CONFIG_HTTP_CLIENT_BASE_URL = process.env['CONFIG_HTTP_CLIENT_BASE_URL'];
const CONFIG_HTTP_CLIENT_TIMEOUT = coerce<number>(process.env['CONFIG_HTTP_CLIENT_TIMEOUT']);

const auth = selectAuth(
  process.env['CONFIG_HTTP_CLIENT_AUTH_USERNAME'],
  process.env['CONFIG_HTTP_CLIENT_AUTH_PASSWORD']
);

const CONFIG_HTTP_CLIENT_KEEPALIVE = coerce<boolean>(process.env['CONFIG_HTTP_CLIENT_KEEPALIVE']);
const CONFIG_HTTP_CLIENT_KEEPALIVE_INITIAL_DELAY = coerce<number>(
  process.env['CONFIG_HTTP_CLIENT_KEEPALIVE_INITIAL_DELAY']
);
const CONFIG_HTTP_CLIENT_KEEPALIVE_MSECS = coerce<number>(
  process.env['CONFIG_HTTP_CLIENT_KEEPALIVE_MSECS']
);
const CONFIG_HTTP_CLIENT_MAX_SOCKETS = coerce<number>(
  process.env['CONFIG_HTTP_CLIENT_MAX_SOCKETS']
);
const CONFIG_HTTP_CLIENT_MAX_SOCKETS_TOTAL = coerce<number>(
  process.env['CONFIG_HTTP_CLIENT_MAX_SOCKETS_TOTAL']
);
const CONFIG_HTTP_CLIENT_MAX_SOCKETS_FREE = coerce<number>(
  process.env['CONFIG_HTTP_CLIENT_MAX_SOCKETS_FREE']
);
const CONFIG_HTTP_CLIENT_REJECT_UNAUTHORIZED = coerce<boolean>(
  process.env['CONFIG_HTTP_CLIENT_REJECT_UNAUTHORIZED']
);

const CONFIG_HTTP_CLIENT_CA = loadFile(process.env['CONFIG_HTTP_CLIENT_CA_PATH'], logger);
const CONFIG_HTTP_CLIENT_CLIENT_CERT = loadFile(
  process.env['CONFIG_HTTP_CLIENT_CLIENT_CERT_PATH'],
  logger
);
const CONFIG_HTTP_CLIENT_CLIENT_KEY = loadFile(
  process.env['CONFIG_HTTP_CLIENT_CLIENT_KEY_PATH'],
  logger
);

const axiosDefault: RequestDefaults = {
  baseURL: CONFIG_HTTP_CLIENT_BASE_URL,
  timeout: CONFIG_HTTP_CLIENT_TIMEOUT,
  auth,
};
const httpAgentOptions: HTTPAgentOptions = {
  keepAlive: CONFIG_HTTP_CLIENT_KEEPALIVE,
  keepAliveInitialDelay: CONFIG_HTTP_CLIENT_KEEPALIVE_INITIAL_DELAY,
  keepAliveMsecs: CONFIG_HTTP_CLIENT_KEEPALIVE_MSECS,
  maxSockets: CONFIG_HTTP_CLIENT_MAX_SOCKETS,
  maxTotalSockets: CONFIG_HTTP_CLIENT_MAX_SOCKETS_TOTAL,
  maxFreeSockets: CONFIG_HTTP_CLIENT_MAX_SOCKETS_FREE,
};
const httpsAgentOptions: HTTPSAgentOptions = {
  keepAlive: CONFIG_HTTP_CLIENT_KEEPALIVE,
  keepAliveInitialDelay: CONFIG_HTTP_CLIENT_KEEPALIVE_INITIAL_DELAY,
  keepAliveMsecs: CONFIG_HTTP_CLIENT_KEEPALIVE_MSECS,
  maxSockets: CONFIG_HTTP_CLIENT_MAX_SOCKETS,
  maxTotalSockets: CONFIG_HTTP_CLIENT_MAX_SOCKETS_TOTAL,
  maxFreeSockets: CONFIG_HTTP_CLIENT_MAX_SOCKETS_FREE,
  rejectUnauthorized: CONFIG_HTTP_CLIENT_REJECT_UNAUTHORIZED,
  ca: CONFIG_HTTP_CLIENT_CA,
  cert: CONFIG_HTTP_CLIENT_CLIENT_CERT,
  key: CONFIG_HTTP_CLIENT_CLIENT_KEY,
};

export const envBasedConfig: Config = {
  requestConfig: checkConfigObject(axiosDefault),
  httpAgentOptions: checkConfigObject(httpAgentOptions),
  httpsAgentOptions: checkConfigObject(httpsAgentOptions),
};
// #endregion
