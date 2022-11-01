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

/** Specifies the results to be returned from a query features Command */
export enum Features {
  /** List of supported Actions and applicable Targets */
  Pairs = 'pairs',
  /** List of profiles supported by this Actuator */
  Profiles = 'profiles',
  /** Maximum number of Commands per minute supported by design or policy */
  RateLimit = 'rate_limit',
  /** List of command and control Language versions supported by this Actuator */
  Versions = 'versions',
}
