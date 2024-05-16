/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { AMQPFrame } from './AMQPFrame.i';

/**
 * Begin frame for AMQP.
 * @see https://docs.oasis-open.org/amqp/core/v1.0/os/amqp-core-session-v1.0-os.html#type-begin
 */
export interface Begin extends AMQPFrame {
  /**
   * The remote channel for this session.
   * If a session is locally initiated, the remote-channel MUST NOT be set. When an endpoint
   * responds to a remotely initiated session, the remote-channel MUST be set to the channel on
   * which the remote session sent the begin.
   */
  remoteChannel?: number;
  /** The transfer-id of the first transfer id the sender will send. */
  nextOutgoingId: number;
  /** The initial incoming-window of the sender. */
  incomingWindow: number;
  /** The initial outgoing-window of the sender. */
  outgoingWindow: number;
  /**
   * The maximum handle value that can be used on the session.
   * The handle-max value is the highest handle value that can be used on the session. A peer MUST
   * NOT attempt to attach a link using a handle value outside the range that its partner can
   * handle. A peer that receives a handle outside the supported range MUST close the connection
   * with the framing-error error-code.
   */
  handleMax?: number;
  /**
   * The extension capabilities the sender supports.
   * A registry of commonly defined session capabilities and their meanings is maintained
   * [AMQPSESSCAP](https://www.amqp.org/specification/1.0/session-capabilities)
   */
  offeredCapabilities?: string[];
  /**
   * The extension capabilities the sender can use if the receiver supports them.
   * The sender MUST NOT attempt to use any capability other than those it has declared in
   * desired-capabilities field.
   */
  desiredCapabilities?: string[];
  /**
   * Session properties.
   * The properties map contains a set of fields intended to indicate information about the session
   * and its container.
   * A registry of commonly defined session properties and their meanings is maintained
   * [AMQPSESSPROP](https://www.amqp.org/specification/1.0/session-properties)
   */
  properties?: Record<string, any>;
}
