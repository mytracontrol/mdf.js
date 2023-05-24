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
