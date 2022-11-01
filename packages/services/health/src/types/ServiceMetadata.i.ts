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
