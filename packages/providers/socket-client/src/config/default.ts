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
