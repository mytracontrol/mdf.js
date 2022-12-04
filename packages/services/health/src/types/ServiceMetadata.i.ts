/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Service meta data configuration */
export interface ServiceMetadata {
  /** Service instance identification in a human readable format */
  name: string;
  /** Service description */
  description: string;
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
  /** Service instance unique identification within the scope of the service identification */
  instanceId: string;
  /** Service unique identification */
  serviceId?: string;
  /** Service group unique identification */
  serviceGroupId?: string;
  /** Service related links */
  links?: {
    self?: string;
    related?: string;
    about?: string;
  };
}
