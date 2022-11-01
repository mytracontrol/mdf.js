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

import { coerce, formatEnv } from '@mdf/utils';
import { Config } from '../provider';

// *************************************************************************************************
// #region Environment variables
const CONFIG_SOCKET_IO_SERVER_PORT = coerce<number>(process.env['CONFIG_SOCKET_IO_SERVER_PORT']);
const CONFIG_SOCKET_IO_SERVER_HOST = process.env['CONFIG_SOCKET_IO_SERVER_HOST'];
const CONFIG_SOCKET_IO_SERVER_PATH = process.env['CONFIG_SOCKET_IO_SERVER_PATH'];
const CONFIG_SOCKET_IO_SERVER_ENABLE_UI = coerce<boolean>(
  process.env['CONFIG_SOCKET_IO_SERVER_ENABLE_UI']
);
const CONFIG_SOCKET_IO_SERVER_CORS__ORIGIN = process.env['CONFIG_SOCKET_IO_SERVER_CORS__ORIGIN'];
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
