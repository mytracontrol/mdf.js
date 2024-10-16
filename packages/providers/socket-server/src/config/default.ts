/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Config } from '../provider';

// *************************************************************************************************
// #region Default values
const CONFIG_SOCKET_IO_SERVER_PORT = 8080;
const CONFIG_SOCKET_IO_SERVER_HOST = 'localhost';
const CONFIG_SOCKET_IO_SERVER_PATH = `/socket.io`;
const CONFIG_SOCKET_IO_SERVER_ENABLE_UI = true;
const CONFIG_SOCKET_IO_SERVER_CORS__ORIGIN = /[\s\S]*/;
const CONFIG_SOCKET_IO_SERVER_CORS__CREDENTIALS = true;
const CONFIG_SOCKET_IO_SERVER_PER_MESSAGE_DEFLATE = true;

export const defaultConfig: Config = {
  port: CONFIG_SOCKET_IO_SERVER_PORT,
  host: CONFIG_SOCKET_IO_SERVER_HOST,
  path: CONFIG_SOCKET_IO_SERVER_PATH,
  enableUI: CONFIG_SOCKET_IO_SERVER_ENABLE_UI,
  cors: {
    origin: CONFIG_SOCKET_IO_SERVER_CORS__ORIGIN,
    credentials: CONFIG_SOCKET_IO_SERVER_CORS__CREDENTIALS,
  },
  perMessageDeflate: CONFIG_SOCKET_IO_SERVER_PER_MESSAGE_DEFLATE,
};
// #endregion

