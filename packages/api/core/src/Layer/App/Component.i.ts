/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash, Multi } from '@mdf.js/crash';
import { EventEmitter } from 'events';

/**
 * A component is any part of the system that has a own identity and can be monitored for error
 * handling. The only requirement is to emit an error event when something goes wrong, to have a
 * name and unique component identifier.
 */
export interface Component extends EventEmitter {
  /**
   * Add a listener for the error event, emitted when the component detects an error.
   * @param event - `error` event
   * @param listener - Error event listener
   * @event
   */
  on(event: 'error', listener: (error: Crash | Multi | Error) => void): this;
  /** Component name */
  name: string;
  /** Component identifier */
  componentId: string;
}
