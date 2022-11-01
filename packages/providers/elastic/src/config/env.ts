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
const CONFIG_ELASTIC_MAX_RETRIES = coerce<number>(
  process.env['DEFAULT_CONFIG_ELASTIC_MAX_RETRIES']
);
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
  ssl: {
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
