/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Control } from '.';
import { ComponentOptions } from './ComponentOptions.i';

export interface ConsumerOptions extends ComponentOptions {
  /** Supported pairs Action-Target pairs */
  actionTargetPairs: Control.ActionTargetPairs;
  /** Supported profiles */
  profiles?: string[];
  /** Actuator */
  actuator?: string[];
}
