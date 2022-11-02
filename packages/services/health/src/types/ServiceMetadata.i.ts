/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Microservice meta data configuration */
export interface ServiceMetadata {
  /** Microservice identification in the MMS Domain */
  name: string;
  /** Microservice version */
  version: string;
  /** Microservice release */
  release: string;
  /** Microservice process identification */
  processId: string;
  /** Microservice description */
  description: string;
  /** Microservice related links */
  links?: {
    self?: string;
    related?: string;
    about?: string;
  };
}
