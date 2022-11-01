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
