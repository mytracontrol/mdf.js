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
const CONFIG_ELASTIC_NODES = ['http://localhost:9200'];
const CONFIG_ELASTIC_MAX_RETRIES = 5;
const CONFIG_ELASTIC_REQUEST_TIMEOUT = 30000;
const CONFIG_ELASTIC_PING_TIMEOUT = 3000;
const CONFIG_ELASTIC_RESURRECT_STRATEGY: 'ping' | 'optimistic' | 'none' = 'ping';
const CONFIG_ELASTIC_NAME = CONFIG_ARTIFACT_ID;

export const defaultConfig: Config = {
  nodes: CONFIG_ELASTIC_NODES,
  maxRetries: CONFIG_ELASTIC_MAX_RETRIES,
  requestTimeout: CONFIG_ELASTIC_REQUEST_TIMEOUT,
  pingTimeout: CONFIG_ELASTIC_PING_TIMEOUT,
  resurrectStrategy: CONFIG_ELASTIC_RESURRECT_STRATEGY,
  name: CONFIG_ELASTIC_NAME,
};
// #endregion
