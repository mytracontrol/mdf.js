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
import { coerce } from '@mdf.js/utils';

const DEFAULT_CONFIG_HEALTH_CLUSTER_UPDATE_INTERVAL = 10000;
// *************************************************************************************************
// #region Health aggregator configuration environment variables
export const CONFIG_HEALTH_CLUSTER_UPDATE_INTERVAL = coerce(
  process.env['CONFIG_HEALTH_CLUSTER_UPDATE_INTERVAL'],
  DEFAULT_CONFIG_HEALTH_CLUSTER_UPDATE_INTERVAL
);

// #endregion
