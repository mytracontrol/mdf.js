/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { ActionType } from './Action.t';

/**
 * Map of each action supported by this actuator to the list of targets applicable to that action
 */
export type ActionTargetPairs = {
  /** Action-Targets */
  [Property in ActionType]?: string[];
};
