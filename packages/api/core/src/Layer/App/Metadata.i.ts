/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Namespace } from './Namespace.t';

/** Application definition */
export interface Metadata {
  /**
   * Service name
   * @example `myOwnService`
   */
  name: string;
  /**
   * Service description
   * @example `My own service description`
   */
  description?: string;
  /**
   * Service version
   * @example `1`
   */
  version: string;
  /**
   * Service release. Its recommended to use semantic versioning.
   * @example `1.0.0`
   */
  release: string;
  /**
   * Service instance unique identification within the scope of the service identification
   * @example `085f47e9-7fad-4da1-b5e5-31fc6eed9f94`
   */
  instanceId: string;
  /**
   * Service unique identification
   * @example `uplink-firehose`, `mqtt-driver`
   */
  serviceId?: string;
  /**
   * Service group unique identification
   * @example `firehose`, `driver`
   */
  serviceGroupId?: string;
  /**
   * Service namespace, used to identify declare which namespace the service belongs to.
   * It must start with `x-` as it is a custom namespace and will be used for custom headers,
   * openc2 commands, etc.
   * @example `x-mytra`
   */
  namespace?: Namespace;
  /**
   * List of string values that can be used to add service-level labels.
   * @example `["primary", "test"]`
   */
  tags?: string[];
  /**
   * Service related links
   */
  links?: {
    /**
     * Link to the own service or health endpoint
     * @example `http://localhost:3000/v1/health`
     */
    self?: string;
    /**
     * Related link for the service
     * @example `https://www.mytra.es`
     */
    related?: string;
    /**
     * About link for the service
     * @example `https://www.mytra.es/about`
     */
    about?: string;
  };
}
