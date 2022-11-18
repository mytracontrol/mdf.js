/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { ActionTargetPairs } from './Pairs.i';
/** Allowed property types */
type AllowedResultPropertyTypes =
  | Record<string, any>
  | string[]
  | number
  | ActionTargetPairs
  | undefined;

/** Result object */
export interface Results {
  /* List of command and control versions supported by this Actuator */
  versions?: string[];
  /**
   * Map of each action supported by this actuator to the list of targets applicable to that action
   */
  pairs?: ActionTargetPairs;
  /** List of profiles supported by this Actuator */
  profiles?: string[];
  /** Maximum number of requests per minute supported by design or policy */
  rate_limit?: number;
  /** Specific profile responses */
  [profile: string]: AllowedResultPropertyTypes;
}
