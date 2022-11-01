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
