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
/**
 * URL for the mongo database
 * @defaultValue `mongodb://127.0.0.1:27017/mdf`
 */
const CONFIG_MONGO_URL = process.env['CONFIG_MONGO_URL'];
/**
 * Path to the CA for the mongo database
 * @defaultValue undefined
 */
const CONFIG_MONGO_CA_PATH = process.env['CONFIG_MONGO_CA_PATH'];
/** CA for the mongo database */
const CA = loadFile(CONFIG_MONGO_CA_PATH, logger);
/**
 * Path to the cert for the mongo database
 * @defaultValue undefined
 */
const CONFIG_MONGO_CERT_PATH = process.env['CONFIG_MONGO_CERT_PATH'];
/** Cert for the mongo database */
const CERT = loadFile(CONFIG_MONGO_CERT_PATH, logger);
/**
 * Path to the key for the mongo database
 * @defaultValue undefined
 */
const CONFIG_MONGO_KEY_PATH = process.env['CONFIG_MONGO_KEY_PATH'];
/** Key for the mongo database */
const KEY = loadFile(CONFIG_MONGO_KEY_PATH, logger);

export const envBasedConfig: Config = {
  url: CONFIG_MONGO_URL,
  ca: CA,
  cert: CERT,
  key: KEY,
};
// #endregion

