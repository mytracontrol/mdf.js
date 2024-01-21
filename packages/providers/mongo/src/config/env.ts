/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { loadFile } from '@mdf.js/utils';
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
};
// #endregion
