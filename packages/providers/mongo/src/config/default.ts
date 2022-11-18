/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Config } from '../provider';
import { CONFIG_ARTIFACT_ID } from './utils';

// *************************************************************************************************
// #region Default values
const CONFIG_MONGO_URL = 'mongodb://127.0.0.1:27017';
const CONFIG_MONGO_SERVER_SELECTION_TIMEOUT_M_S = 10000;
const CONFIG_MONGO_MIN_POOL_SIZE = 4;
const CONFIG_MONGO_KEEP_ALIVE = true;
const CONFIG_MONGO_KEEP_ALIVE_INITIAL_DELAY = 10000;
const CONFIG_MONGO_CONNECT_TIMEOUT_M_S = 10000;
const CONFIG_MONGO_SOCKET_TIMEOUT_M_S = 10000;
const CONFIG_MONGO_FAMILY = 4;
const CONFIG_MONGO_DIRECT_CONNECTION = false;

export const defaultConfig: Config = {
  url: CONFIG_MONGO_URL,
  appName: CONFIG_ARTIFACT_ID,
  serverSelectionTimeoutMS: CONFIG_MONGO_SERVER_SELECTION_TIMEOUT_M_S,
  keepAlive: CONFIG_MONGO_KEEP_ALIVE,
  keepAliveInitialDelay: CONFIG_MONGO_KEEP_ALIVE_INITIAL_DELAY,
  connectTimeoutMS: CONFIG_MONGO_CONNECT_TIMEOUT_M_S,
  socketTimeoutMS: CONFIG_MONGO_SOCKET_TIMEOUT_M_S,
  minPoolSize: CONFIG_MONGO_MIN_POOL_SIZE,
  directConnection: CONFIG_MONGO_DIRECT_CONNECTION,
  family: CONFIG_MONGO_FAMILY,
};
// #endregion
