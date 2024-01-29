/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { coerce, loadFile } from '@mdf.js/utils';
import { Config } from '../provider';
import { logger, nodeToNodes, selectAuth } from './utils';

type ResurrectStrategy = 'ping' | 'optimistic' | 'none' | undefined;
// *************************************************************************************************
// #region Environment variables
const CONFIG_ELASTIC_NODES = nodeToNodes(
  process.env['CONFIG_ELASTIC_NODE'],
  process.env['CONFIG_ELASTIC_NODES']
);
const CONFIG_ELASTIC_MAX_RETRIES = coerce<number>(process.env['CONFIG_ELASTIC_MAX_RETRIES']);
const CONFIG_ELASTIC_REQUEST_TIMEOUT = coerce<number>(
  process.env['CONFIG_ELASTIC_REQUEST_TIMEOUT']
);
const CONFIG_ELASTIC_PING_TIMEOUT = coerce<number>(process.env['CONFIG_ELASTIC_PING_TIMEOUT']);
const CONFIG_ELASTIC_RESURRECT_STRATEGY = process.env[
  'CONFIG_ELASTIC_RESURRECT_STRATEGY'
] as ResurrectStrategy;
const CONFIG_ELASTIC_PROXY = process.env['CONFIG_ELASTIC_PROXY'];

const CONFIG_ELASTIC_NAME = process.env['CONFIG_ELASTIC_NAME'];
const CONFIG_ELASTIC_HTTP_SSL_VERIFY = coerce<boolean>(
  process.env['CONFIG_ELASTIC_HTTP_SSL_VERIFY']
);

const CONFIG_ELASTIC_CA = loadFile(process.env['CONFIG_ELASTIC_CA_PATH'], logger);
const CONFIG_ELASTIC_CLIENT_CERT = loadFile(process.env['CONFIG_ELASTIC_CLIENT_CERT_PATH'], logger);
const CONFIG_ELASTIC_CLIENT_KEY = loadFile(process.env['CONFIG_ELASTIC_CLIENT_KEY_PATH'], logger);

const CONFIG_ELASTIC_TLS_SERVER_NAME = process.env['CONFIG_ELASTIC_TLS_SERVER_NAME'];

const auth = selectAuth(
  process.env['CONFIG_ELASTIC_AUTH_USERNAME'],
  process.env['CONFIG_ELASTIC_AUTH_PASSWORD']
);

export const envBasedConfig: Config = {
  nodes: CONFIG_ELASTIC_NODES,
  maxRetries: CONFIG_ELASTIC_MAX_RETRIES,
  requestTimeout: CONFIG_ELASTIC_REQUEST_TIMEOUT,
  pingTimeout: CONFIG_ELASTIC_PING_TIMEOUT,
  resurrectStrategy: CONFIG_ELASTIC_RESURRECT_STRATEGY,
  tls: {
    ca: CONFIG_ELASTIC_CA,
    cert: CONFIG_ELASTIC_CLIENT_CERT,
    key: CONFIG_ELASTIC_CLIENT_KEY,
    rejectUnauthorized: CONFIG_ELASTIC_HTTP_SSL_VERIFY,
    servername: CONFIG_ELASTIC_TLS_SERVER_NAME,
  },
  name: CONFIG_ELASTIC_NAME,
  auth,
  proxy: CONFIG_ELASTIC_PROXY,
};
// #endregion
