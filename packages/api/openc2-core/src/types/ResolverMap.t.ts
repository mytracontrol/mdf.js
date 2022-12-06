/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { ActionType, AllowedResultPropertyTypes, Namespace } from './control';

export type ResolverEntry = `${ActionType}:${Namespace}:${string}`;
export type Resolver = <T = any>(target: T) => Promise<AllowedResultPropertyTypes>;
export type ResolverMap = {
  /**
   * Map of each action supported by this actuator to the list of targets applicable to that action
   * @example
   * {
   *  'query:x-ownDomain:ownValue': ...
   * }
   */
  [entry in ResolverEntry]?: Resolver;
};
