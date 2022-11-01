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

import { formatEnv, loadFile } from '@mdf/utils';
import { Config } from '../provider';
import { logger } from './utils';

// *************************************************************************************************
// #region Environment variables
const CONFIG_SOCKET_IO_CLIENT_URL = process.env['CONFIG_SOCKET_IO_CLIENT_URL'];
const CONFIG_SOCKET_IO_CLIENT_PATH = process.env['CONFIG_SOCKET_IO_CLIENT_PATH'];
const CONFIG_SOCKET_IO_CLIENT_TRANSPORTS = process.env['CONFIG_SOCKET_IO_CLIENT_TRANSPORTS'];

const CONFIG_SOCKET_IO_CLIENT_CA = loadFile(process.env['CONFIG_SOCKET_IO_CLIENT_CA_PATH'], logger);
const CONFIG_SOCKET_IO_CLIENT_CLIENT_CERT = loadFile(
  process.env['CONFIG_SOCKET_IO_CLIENT_CLIENT_CERT_PATH'],
  logger
);
const CONFIG_SOCKET_IO_CLIENT_CLIENT_KEY = loadFile(
  process.env['CONFIG_SOCKET_IO_CLIENT_CLIENT_KEY_PATH'],
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
