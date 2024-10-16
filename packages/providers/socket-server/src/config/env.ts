/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { coerce, formatEnv } from '@mdf.js/utils';
import { Config } from '../provider';

// *************************************************************************************************
// #region Environment variables
/**
 * Port where the server will listen
 * @defaultValue 8080
 */
const CONFIG_SOCKET_IO_SERVER_PORT = coerce<number>(process.env['CONFIG_SOCKET_IO_SERVER_PORT']);
/**
 * Host where the server will listen
 * @defaultValue 'localhost'
 */
const CONFIG_SOCKET_IO_SERVER_HOST = process.env['CONFIG_SOCKET_IO_SERVER_HOST'];
/**
 * Path where the server will listen
 * @defaultValue '/socket.io'
 */
const CONFIG_SOCKET_IO_SERVER_PATH = process.env['CONFIG_SOCKET_IO_SERVER_PATH'];
/**
 * Enable the UI
 * @defaultValue true
 */
const CONFIG_SOCKET_IO_SERVER_ENABLE_UI = coerce<boolean>(
  process.env['CONFIG_SOCKET_IO_SERVER_ENABLE_UI']
);
/**
 * CORS origin
 * @defaultValue `/[\s\S]*\/`
 */
const CONFIG_SOCKET_IO_SERVER_CORS__ORIGIN = process.env['CONFIG_SOCKET_IO_SERVER_CORS__ORIGIN'];
/**
 * CORS credentials
 * @defaultValue true
 */
const CONFIG_SOCKET_IO_SERVER_CORS__CREDENTIALS = coerce<boolean>(
  process.env['CONFIG_SOCKET_IO_SERVER_CORS__CREDENTIALS']
);

export const envBasedConfig: Config = {
  port: CONFIG_SOCKET_IO_SERVER_PORT,
  host: CONFIG_SOCKET_IO_SERVER_HOST,
  path: CONFIG_SOCKET_IO_SERVER_PATH,
  enableUI: CONFIG_SOCKET_IO_SERVER_ENABLE_UI,
  cors: {
    origin: CONFIG_SOCKET_IO_SERVER_CORS__ORIGIN,
    credentials: CONFIG_SOCKET_IO_SERVER_CORS__CREDENTIALS,
  },
  ...formatEnv('CONFIG_SOCKET_IO_SERVER_'),
};
// #endregion
