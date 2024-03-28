/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Config } from '../provider';
import { CONFIG_ARTIFACT_ID } from './utils';

// *************************************************************************************************
// #region Default values
const ELASTIC_NODES = ['http://localhost:9200'];
const ELASTIC_MAX_RETRIES = 5;
const ELASTIC_REQUEST_TIMEOUT = 30000;
const ELASTIC_PING_TIMEOUT = 3000;
const ELASTIC_RESURRECT_STRATEGY: 'ping' | 'optimistic' | 'none' = 'ping';
const ELASTIC_NAME = CONFIG_ARTIFACT_ID;

export const defaultConfig: Config = {
  nodes: ELASTIC_NODES,
  maxRetries: ELASTIC_MAX_RETRIES,
  requestTimeout: ELASTIC_REQUEST_TIMEOUT,
  pingTimeout: ELASTIC_PING_TIMEOUT,
  resurrectStrategy: ELASTIC_RESURRECT_STRATEGY,
  name: ELASTIC_NAME,
};
// #endregion
