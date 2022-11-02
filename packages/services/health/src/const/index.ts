/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { coerce } from '@mdf.js/utils';

const DEFAULT_CONFIG_HEALTH_CLUSTER_UPDATE_INTERVAL = 10000;
// *************************************************************************************************
// #region Health aggregator configuration environment variables
export const CONFIG_HEALTH_CLUSTER_UPDATE_INTERVAL = coerce(
  process.env['CONFIG_HEALTH_CLUSTER_UPDATE_INTERVAL'],
  DEFAULT_CONFIG_HEALTH_CLUSTER_UPDATE_INTERVAL
);

// #endregion
