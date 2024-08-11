/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { AMQPFrame } from './AMQPFrame.i';
import { Error } from './Error.i';

/**
 * Detach frame for AMQP.
 * @see https://docs.oasis-open.org/amqp/core/v1.0/os/amqp-core-session-v1.0-os.html#type-detach
 */
export interface Detach extends AMQPFrame {
  /** The local handle of the link to be detached. */
  handle: number;
  /** If true then the sender has closed the link. */
  closed?: boolean;
  /**
   * If set, this field indicates that the link is being detached due to an error condition.
   * The value of the field SHOULD contain details on the cause of the error.
   */
  error?: Error;
}
