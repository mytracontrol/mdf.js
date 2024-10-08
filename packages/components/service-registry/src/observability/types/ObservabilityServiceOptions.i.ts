/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

export interface ObservabilityServiceOptions {
  /** Port to listen for incoming requests */
  port?: number;
  /** Primary port to listen for incoming requests on cluster mode */
  primaryPort?: number;
  /** Host IP Addresses to be attached */
  host?: string;
  /** Max size of the registry */
  maxSize?: number;
  /** Include stack trace in the error */
  includeStack?: boolean;
  /** Enable cluster mode */
  isCluster?: boolean;
  /** Cluster polling interval */
  clusterUpdateInterval?: number;
}
