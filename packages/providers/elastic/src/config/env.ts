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

/**
 * Node to connect to. If CONFIG_ELASTIC_NODES is set, this is ignored.
 * @defaultValue undefined
 */
const CONFIG_ELASTIC_NODE = process.env['CONFIG_ELASTIC_NODE'];
/**
 * List of nodes to connect to. If this is set, CONFIG_ELASTIC_NODE is ignored.
 * @defaultValue ['http://localhost:9200']
 */
const CONFIG_ELASTIC_NODES = process.env['CONFIG_ELASTIC_NODES'];

const ELASTIC_NODES = nodeToNodes(CONFIG_ELASTIC_NODE, CONFIG_ELASTIC_NODES);
/**
 * Maximum number of retries before failing the request.
 * @defaultValue 5
 */
const CONFIG_ELASTIC_MAX_RETRIES = coerce<number>(process.env['CONFIG_ELASTIC_MAX_RETRIES']);
/**
 * Time in milliseconds before the request is considered a timeout.
 * @defaultValue 30000
 */
const CONFIG_ELASTIC_REQUEST_TIMEOUT = coerce<number>(
  process.env['CONFIG_ELASTIC_REQUEST_TIMEOUT']
);
/**
 * Time in milliseconds before the request is considered a timeout.
 * @defaultValue 3000
 */
const CONFIG_ELASTIC_PING_TIMEOUT = coerce<number>(process.env['CONFIG_ELASTIC_PING_TIMEOUT']);
/**
 * Strategy to use when resurrecting a connection. Possible values are 'ping', 'optimistic' or
 * 'none'.
 * @defaultValue 'ping'
 */
const CONFIG_ELASTIC_RESURRECT_STRATEGY = process.env[
  'CONFIG_ELASTIC_RESURRECT_STRATEGY'
] as ResurrectStrategy;
/**
 * Proxy to use when connecting to the Elasticsearch cluster.
 * @defaultValue undefined
 */
const CONFIG_ELASTIC_PROXY = process.env['CONFIG_ELASTIC_PROXY'];

/**
 * Name of the Elasticsearch client.
 * @defaultValue CONFIG_ARTIFACT_ID
 */
const CONFIG_ELASTIC_NAME = process.env['CONFIG_ELASTIC_NAME'];
/**
 * Whether to verify the SSL certificate.
 * @defaultValue true
 */
const CONFIG_ELASTIC_HTTP_SSL_VERIFY = coerce<boolean>(
  process.env['CONFIG_ELASTIC_HTTP_SSL_VERIFY']
);

/**
 * Path to the CA certificate.
 * @defaultValue undefined
 */
const CONFIG_ELASTIC_CA_PATH = process.env['CONFIG_ELASTIC_CA_PATH'];
const CA = loadFile(CONFIG_ELASTIC_CA_PATH, logger);
/**
 * Path to the client certificate.
 * @defaultValue undefined
 */
const CONFIG_ELASTIC_CLIENT_CERT_PATH = process.env['CONFIG_ELASTIC_CLIENT_CERT_PATH'];
const CERT = loadFile(CONFIG_ELASTIC_CLIENT_CERT_PATH, logger);
/**
 * Path to the client key.
 * @defaultValue undefined
 */
const CONFIG_ELASTIC_CLIENT_KEY_PATH = process.env['CONFIG_ELASTIC_CLIENT_KEY_PATH'];
const KEY = loadFile(CONFIG_ELASTIC_CLIENT_KEY_PATH, logger);

/**
 * Server name for the TLS certificate.
 * @defaultValue undefined
 */
const CONFIG_ELASTIC_TLS_SERVER_NAME = process.env['CONFIG_ELASTIC_TLS_SERVER_NAME'];

/**
 * Username for the Elasticsearch cluster. If this is set, a password must also be provided.
 * @defaultValue undefined
 */
const CONFIG_ELASTIC_AUTH_USERNAME = process.env['CONFIG_ELASTIC_AUTH_USERNAME'];
/**
 * Password for the Elasticsearch cluster. If this is set, a username must also be provided.
 * @defaultValue undefined
 */
const CONFIG_ELASTIC_AUTH_PASSWORD = process.env['CONFIG_ELASTIC_AUTH_PASSWORD'];

const auth = selectAuth(CONFIG_ELASTIC_AUTH_USERNAME, CONFIG_ELASTIC_AUTH_PASSWORD);

export const envBasedConfig: Config = {
  nodes: ELASTIC_NODES,
  maxRetries: CONFIG_ELASTIC_MAX_RETRIES,
  requestTimeout: CONFIG_ELASTIC_REQUEST_TIMEOUT,
  pingTimeout: CONFIG_ELASTIC_PING_TIMEOUT,
  resurrectStrategy: CONFIG_ELASTIC_RESURRECT_STRATEGY,
  tls: {
    ca: CA,
    cert: CERT,
    key: KEY,
    rejectUnauthorized: CONFIG_ELASTIC_HTTP_SSL_VERIFY,
    servername: CONFIG_ELASTIC_TLS_SERVER_NAME,
  },
  name: CONFIG_ELASTIC_NAME,
  auth,
  proxy: CONFIG_ELASTIC_PROXY,
};
// #endregion
