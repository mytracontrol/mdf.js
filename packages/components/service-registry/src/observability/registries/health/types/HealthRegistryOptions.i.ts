/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Layer } from '@mdf.js/core';
import { LoggerInstance } from '@mdf.js/logger';

export interface HealthRegistryOptions {
  /** Cluster polling interval */
  clusterUpdateInterval?: number;
  /** App health metadata properties */
  applicationMetadata: Layer.App.Metadata;
  /** Is the service running in cluster mode */
  isCluster?: boolean;
  /** Logger instance */
  logger?: LoggerInstance;
}
