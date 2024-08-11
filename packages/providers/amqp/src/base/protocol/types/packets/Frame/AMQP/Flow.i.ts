/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { AMQPFrame } from './AMQPFrame.i';

/**
 * Flow frame for AMQP.
 * @see https://docs.oasis-open.org/amqp/core/v1.0/os/amqp-core-session-v1.0-os.html#type-flow
 */
export interface Flow extends AMQPFrame {
  /**
   * Identifies the expected transfer-id of the next incoming transfer frame.
   * This value MUST be set if the peer has received the begin frame for the session, and MUST NOT
   * be set if it has not.
   */
  nextIncomingId?: number;
  /**
   * Defines the maximum number of incoming transfer frames that the endpoint can currently receive.
   */
  incomingWindow: number;
  /** The transfer-id that will be assigned to the next outgoing transfer frame. */
  nextOutgoingId: number;
  /**
   * Defines the maximum number of outgoing transfer frames that the endpoint could potentially
   * currently send.
   */
  outgoingWindow: number;
  /**
   * If set, indicates that the flow frame carries flow state information for the local link
   * endpoint associated with the given handle. If not set, the flow frame is carrying only
   * information pertaining to the session endpoint.
   * If set to a handle that is not currently associated with an attached link, the recipient MUST
   * respond by ending the session with an unattached-handle session error.
   */
  handle?: number;
  /**
   * When the handle field is not set, this field MUST NOT be set.
   * When the handle identifies that the flow state is being sent from the sender link endpoint to
   * receiver link endpoint this field MUST be set to the current delivery-count of the link
   * endpoint.
   * When the flow state is being sent from the receiver endpoint to the sender endpoint this field
   * MUST be set to the last known value of the corresponding sending endpoint. In the event that
   * the receiving link endpoint has not yet seen the initial attach frame from the sender this
   * field MUST NOT be set.
   */
  deliveryCount?: number;
  /**
   * The current maximum number of messages that can be handled at the receiver endpoint of the
   * link. Only the receiver endpoint can independently set this value. The sender endpoint sets
   * this to the last known value seen from the receiver.
   * When the handle field is not set, this field MUST NOT be set.
   */
  linkCredit?: number;
  /**
   * The number of messages awaiting credit at the link sender endpoint. Only the sender can
   * independently set this value. The receiver sets this to the last known value seen from the
   * sender.
   * When the handle field is not set, this field MUST NOT be set.
   */
  available?: number;
  /**
   * When flow state is sent from the sender to the receiver, this field contains the actual drain
   * mode of the sender. When flow state is sent from the receiver to the sender, this field
   * contains the desired drain mode of the receiver.
   * When the handle field is not set, this field MUST NOT be set.
   */
  drain?: boolean;
  /**
   * If set to true then the receiver SHOULD send its state at the earliest convenient opportunity.
   * If set to true, and the handle field is not set, then the sender only requires session endpoint
   * state to be echoed, however, the receiver MAY fulfil this requirement by sending a flow
   * performative carrying link-specific state (since any such flow also carries session state).
   * If a sender makes multiple requests for the same state before the receiver can reply, the
   * receiver MAY send only one flow in return.
   * Note that if a peer responds to echo requests with flows which themselves have the echo field
   * set to true, an infinite loop could result if its partner adopts the same policy
   * (therefore such a policy SHOULD be avoided).
   */
  echo?: boolean;
  /**
   * A registry of commonly defined link state properties and their meanings is maintained
   * [AMQPLINKSTATEPROP](https://www.amqp.org/specification/1.0/link-state-properties).
   * When the handle field is not set, this field MUST NOT be set.
   */
  properties?: Record<string, any>;
}
