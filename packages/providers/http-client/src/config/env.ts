/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { coerce, loadFile } from '@mdf.js/utils';
import { CreateAxiosDefaults as RequestDefaults } from 'axios';
import { AgentOptions as HTTPAgentOptions } from 'http';
import { AgentOptions as HTTPSAgentOptions } from 'https';
import { Config } from '../provider';
import { checkConfigObject, logger, selectAuth } from './utils';

// *************************************************************************************************
// #region Environment variables

/**
 * Base URL for the HTTP client requests.
 * @defaultValue undefined
 */
const CONFIG_HTTP_CLIENT_BASE_URL = process.env['CONFIG_HTTP_CLIENT_BASE_URL'];
/**
 * Time in milliseconds before the request is considered a timeout.
 * @defaultValue undefined
 */
const CONFIG_HTTP_CLIENT_TIMEOUT = coerce<number>(process.env['CONFIG_HTTP_CLIENT_TIMEOUT']);
/**
 * Username for the HTTP client authentication, if username is set, password must be set too.
 * @defaultValue undefined
 */
const CONFIG_HTTP_CLIENT_AUTH_USERNAME = process.env['CONFIG_HTTP_CLIENT_AUTH_USERNAME'];
/**
 * Password for the HTTP client authentication if password is set, username must be set too.
 * @defaultValue undefined
 */
const CONFIG_HTTP_CLIENT_AUTH_PASSWORD = process.env['CONFIG_HTTP_CLIENT_AUTH_PASSWORD'];

const auth = selectAuth(CONFIG_HTTP_CLIENT_AUTH_USERNAME, CONFIG_HTTP_CLIENT_AUTH_PASSWORD);

/**
 * Keep sockets around in a pool to be used by other requests in the future.
 * @defaultValue false
 */
const CONFIG_HTTP_CLIENT_KEEPALIVE = coerce<boolean>(process.env['CONFIG_HTTP_CLIENT_KEEPALIVE']);
/**
 * Time in milliseconds before the keep alive feature is enabled.
 * @defaultValue undefined
 */
const CONFIG_HTTP_CLIENT_KEEPALIVE_INITIAL_DELAY = coerce<number>(
  process.env['CONFIG_HTTP_CLIENT_KEEPALIVE_INITIAL_DELAY']
);
/**
 * When using HTTP KeepAlive, how often to send TCP KeepAlive packets over sockets being kept alive.
 * Only relevant if keepAlive is set to true.
 * @defaultValue 1000
 */
const CONFIG_HTTP_CLIENT_KEEPALIVE_MSECS = coerce<number>(
  process.env['CONFIG_HTTP_CLIENT_KEEPALIVE_MSECS']
);
/**
 * Maximum number of sockets to allow per host. Default for Node 0.10 is 5, default for Node 0.12
 * is Infinity.
 * @defaultValue Infinity
 */
const CONFIG_HTTP_CLIENT_MAX_SOCKETS = coerce<number>(
  process.env['CONFIG_HTTP_CLIENT_MAX_SOCKETS']
);
/**
 * Maximum number of sockets allowed for all hosts in total. Each request will use a new socket
 * until the maximum is reached. Default: Infinity.
 * @defaultValue Infinity
 */
const CONFIG_HTTP_CLIENT_MAX_SOCKETS_TOTAL = coerce<number>(
  process.env['CONFIG_HTTP_CLIENT_MAX_SOCKETS_TOTAL']
);
/**
 * Maximum number of sockets to leave open in a free state.
 * Only relevant if keepAlive is set to true.
 * @defaultValue 256
 */
const CONFIG_HTTP_CLIENT_MAX_SOCKETS_FREE = coerce<number>(
  process.env['CONFIG_HTTP_CLIENT_MAX_SOCKETS_FREE']
);
/**
 * Reject unauthorized TLS certificates.
 * @defaultValue true
 */
const CONFIG_HTTP_CLIENT_REJECT_UNAUTHORIZED = coerce<boolean>(
  process.env['CONFIG_HTTP_CLIENT_REJECT_UNAUTHORIZED']
);

/**
 * Path to the CA certificate file.
 * @defaultValue undefined
 */
const CONFIG_HTTP_CLIENT_CA_PATH = process.env['CONFIG_HTTP_CLIENT_CA_PATH'];
const CA = loadFile(CONFIG_HTTP_CLIENT_CA_PATH, logger);
/**
 * Path to the client certificate file.
 * @defaultValue undefined
 */
const CONFIG_HTTP_CLIENT_CLIENT_CERT_PATH = process.env['CONFIG_HTTP_CLIENT_CLIENT_CERT_PATH'];
const CERT = loadFile(CONFIG_HTTP_CLIENT_CLIENT_CERT_PATH, logger);
/**
 * Path to the client key file.
 * @defaultValue undefined
 */
const CONFIG_HTTP_CLIENT_CLIENT_KEY_PATH = process.env['CONFIG_HTTP_CLIENT_CLIENT_KEY_PATH'];
const KEY = loadFile(CONFIG_HTTP_CLIENT_CLIENT_KEY_PATH, logger);

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
  ca: CA,
  cert: CERT,
  key: KEY,
};

export const envBasedConfig: Config = {
  requestConfig: checkConfigObject(axiosDefault),
  httpAgentOptions: checkConfigObject(httpAgentOptions),
  httpsAgentOptions: checkConfigObject(httpsAgentOptions),
};
// #endregion

