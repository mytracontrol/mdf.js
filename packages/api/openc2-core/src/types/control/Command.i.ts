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
