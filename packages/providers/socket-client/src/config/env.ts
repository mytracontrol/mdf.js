/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { formatEnv, loadFile } from '@mdf.js/utils';
import { Config } from '../provider';
import { logger } from './utils';

// *************************************************************************************************
// #region Environment variables
/**
 * URL of the server
 * @defaultValue 'http://localhost:8080'
 */
const CONFIG_SOCKET_IO_CLIENT_URL = process.env['CONFIG_SOCKET_IO_CLIENT_URL'];
/**
 * Path where the server will listen
 * @defaultValue '/socket.io'
 */
const CONFIG_SOCKET_IO_CLIENT_PATH = process.env['CONFIG_SOCKET_IO_CLIENT_PATH'];
/**
 * Transports to use
 * @defaultValue ['websocket']
 */
const CONFIG_SOCKET_IO_CLIENT_TRANSPORTS = process.env['CONFIG_SOCKET_IO_CLIENT_TRANSPORTS'];

/**
 * CA file path
 * @defaultValue undefined
 */
const CONFIG_SOCKET_IO_CLIENT_CA_PATH = process.env['CONFIG_SOCKET_IO_CLIENT_CA_PATH'];
const CONFIG_SOCKET_IO_CLIENT_CA = loadFile(CONFIG_SOCKET_IO_CLIENT_CA_PATH, logger);
/**
 * Client cert file path
 * @defaultValue undefined
 */
const CONFIG_SOCKET_IO_CLIENT_CLIENT_CERT_PATH =
  process.env['CONFIG_SOCKET_IO_CLIENT_CLIENT_CERT_PATH'];
const CONFIG_SOCKET_IO_CLIENT_CLIENT_CERT = loadFile(
  CONFIG_SOCKET_IO_CLIENT_CLIENT_CERT_PATH,
  logger
);
/**
 * Client key file path
 * @defaultValue undefined
 */
const CONFIG_SOCKET_IO_CLIENT_CLIENT_KEY_PATH =
  process.env['CONFIG_SOCKET_IO_CLIENT_CLIENT_KEY_PATH'];
const CONFIG_SOCKET_IO_CLIENT_CLIENT_KEY = loadFile(
  CONFIG_SOCKET_IO_CLIENT_CLIENT_KEY_PATH,
  logger
);

export const envBasedConfig: Config = {
  url: CONFIG_SOCKET_IO_CLIENT_URL,
  path: CONFIG_SOCKET_IO_CLIENT_PATH,
  transports: CONFIG_SOCKET_IO_CLIENT_TRANSPORTS
    ? CONFIG_SOCKET_IO_CLIENT_TRANSPORTS.split(',')
    : undefined,
  ca: CONFIG_SOCKET_IO_CLIENT_CA as string | undefined,
  cert: CONFIG_SOCKET_IO_CLIENT_CLIENT_CERT as string | undefined,
  key: CONFIG_SOCKET_IO_CLIENT_CLIENT_KEY as string | undefined,
  ...formatEnv('CONFIG_SOCKET_IO_CLIENT_'),
};
// #endregion
