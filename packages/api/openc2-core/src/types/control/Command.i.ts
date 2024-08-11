/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Action, Actuator, Arguments, Target } from './common';

/** Command object */
export interface Command {
  /** The task or activity to be performed (i.e., the 'verb') */
  action: Action;
  /** The object of the Action. The Action is performed on the Target */
  target: Target;
  /** The subject of the Action. The Actuator executes the Action on the Target */
  actuator?: Actuator;
  /** Additional information that applies to the Command */
  args?: Arguments;
  /** An identifier of this Command */
  command_id?: string;
}
