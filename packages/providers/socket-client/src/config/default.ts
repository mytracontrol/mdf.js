/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Config } from '../provider';

// *************************************************************************************************
// #region Default values
const CONFIG_SOCKET_IO_CLIENT_URL = 'http://localhost:8080';
const CONFIG_SOCKET_IO_CLIENT_PATH = `/socket.io`;
const CONFIG_SOCKET_IO_CLIENT_TRANSPORTS = ['websocket'];

export const defaultConfig: Config = {
  url: CONFIG_SOCKET_IO_CLIENT_URL,
  path: CONFIG_SOCKET_IO_CLIENT_PATH,
  transports: CONFIG_SOCKET_IO_CLIENT_TRANSPORTS,
};
// #endregion
