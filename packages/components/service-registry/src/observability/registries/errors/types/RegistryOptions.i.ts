/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { LoggerInstance } from '@mdf.js/logger';

export interface RegistryOptions {
  /**
   * Service name
   * @example `myOwnService`
   */
  name: string;
  /**
   * Service instance unique identification within the scope of the service identification
   * @example `085f47e9-7fad-4da1-b5e5-31fc6eed9f94`
   */
  instanceId: string;
  /** Cluster polling interval */
  clusterUpdateInterval?: number;
  /** Max size of the registry */
  maxSize?: number;
  /** Is the service running in cluster mode */
  isCluster?: boolean;
  /** Logger instance */
  logger?: LoggerInstance;
  /** Include stack trace in the error */
  includeStack?: boolean;
}
