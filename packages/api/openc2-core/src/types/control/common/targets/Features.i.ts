/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
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
