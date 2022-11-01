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
const CONFIG_MONGO_URL = process.env['CONFIG_MONGO_URL'];
const CONFIG_MONGO_CA = loadFile(process.env['CONFIG_MONGO_CA_PATH'], logger);
const CONFIG_MONGO_CERT = loadFile(process.env['CONFIG_MONGO_CERT_PATH'], logger);
const CONFIG_MONGO_KEY = loadFile(process.env['CONFIG_MONGO_KEY_PATH'], logger);

export const envBasedConfig: Config = {
  url: CONFIG_MONGO_URL,
  ca: CONFIG_MONGO_CA,
  cert: CONFIG_MONGO_CERT,
  key: CONFIG_MONGO_KEY,
  ...formatEnv('CONFIG_MONGO_'),
};
// #endregion
