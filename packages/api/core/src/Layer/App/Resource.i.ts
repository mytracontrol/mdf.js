/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash, Multi } from '@mdf.js/crash';
import { Checks, Status } from '../../Health';
import { Component } from './Component.i';

/**
 * A resource is extended component that represent the access to an external/internal resource,
 * besides the error handling and identity, it has a start, stop and close methods to manage the
 * resource lifecycle. It also has a checks property to define the checks that will be performed
 * over the resource to achieve the resulted status.
 * The most typical example of a resource are the {@link Provider} that allow to access to external
 * databases, message brokers, etc.
 */
export interface Resource extends Component {
  /**
   * Add a listener for the `error` event, emitted when the component detects an error.
   * @param event - `error` event
   * @param listener - Error event listener
   * @event
   */
  on(event: 'error', listener: (error: Crash | Multi | Error) => void): this;
  /**
   * Add a listener for the status event, emitted when the component status changes.
   * @param event - `status` event
   * @param listener - Status event listener
   * @event
   */
  on(event: 'status', listener: (status: Status) => void): this;
  /** Checks performed over this component to achieve the resulted status */
  checks: Checks;
  /** Resource status */
  status: Status;
  /** Resource start function */
  start: () => Promise<void>;
  /** Resource stop function */
  stop: () => Promise<void>;
  /** Resource close function */
  close: () => Promise<void>;
}
