/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Control } from '.';
import { ComponentOptions } from './ComponentOptions.i';
import { ResolverMap } from './ResolverMap.t';

export interface ConsumerOptions extends ComponentOptions {
  /** Supported pairs Action-Target pairs */
  actionTargetPairs: Control.ActionTargetPairs;
  /** Supported profiles */
  profiles?: string[];
  /** Actuator */
  actuator?: string[];
  /** Resolver */
  resolver?: ResolverMap;
}
