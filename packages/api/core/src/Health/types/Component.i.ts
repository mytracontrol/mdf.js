/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { EventEmitter } from 'events';
import { Checks } from './Checks.t';
import { Status } from './Status.t';

export interface Component extends EventEmitter {
  /** Emitted when the component throw an error*/
  on(event: 'error', listener: (error: Crash | Error) => void): this;
  /** Emitted on every status change */
  on(event: 'status', listener: (status: Status) => void): this;
  /** Component name */
  name: string;
  /** Component */
  componentId: string;
  /** Checks performed over this component to achieve the resulted status */
  checks: Checks;
}
