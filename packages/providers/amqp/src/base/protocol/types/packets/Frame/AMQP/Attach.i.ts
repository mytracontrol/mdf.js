/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { ReceiverSettleMode } from '../../../ReceiverSettleMode.t';
import { Role } from '../../../Role.t';
import { SenderSettleMode } from '../../../SenderSettleMode.t';
import { AMQPFrame } from './AMQPFrame.i';

/**
 * Attach frame for AMQP.
 * @see https://docs.oasis-open.org/amqp/core/v1.0/os/amqp-core-session-v1.0-os.html#type-attach
 */
export interface Attach extends AMQPFrame {
  /**
   * The name of the link.
   * This name uniquely identifies the link from the container of the source to the container of the
   * target node, e.g., if the container of the source node is A, and the container of the target node
   * is B, the link MAY be globally identified by the (ordered) tuple (A,B,<name>).
   */
  name: string;
  /**
   * The handle for the link while attached.
   * The numeric handle assigned by the the peer as a shorthand to refer to the link in all
   * performatives that reference the link until the it is detached. See subsection 2.6.2.
   * The handle MUST NOT be used for other open links. An attempt to attach using a handle which is
   * already associated with a link MUST be responded to with an immediate close carrying a
   * handle-in-use session-error.
   * To make it easier to monitor AMQP link attach frames, it is RECOMMENDED that implementations
   * always assign the lowest available handle to this field.
   */
  handle: number;
  /**
   * The role of the link endpoint.
   * The role being played by the peer, i.e., whether the peer is the sender or the receiver of
   * messages on the link.
   */
  role: Role;
  /**
   * The delivery settlement policy for the sender.
   * When set at the receiver this indicates the desired value for the settlement mode at the sender.
   * When set at the sender this indicates the actual settlement mode in use. The sender SHOULD
   * respect the receiver's desired settlement mode if the receiver initiates the attach exchange and
   * the sender supports the desired mode.
   */
  sndSettleMode?: SenderSettleMode;
  /**
   * The delivery settlement policy for the receiver.
   * When set at the sender this indicates the desired value for the settlement mode at the receiver.
   * When set at the receiver this indicates the actual settlement mode in use. The receiver SHOULD
   * respect the sender's desired settlement mode if the sender initiates the attach exchange and the
   * receiver supports the desired mode.
   */
  rcvSettleMode?: ReceiverSettleMode;
  /**
   * The source for messages.
   * If no source is specified on an outgoing link, then there is no source currently attached to the
   * link. A link with no source will never produce outgoing messages.
   */
  source?: any;
  /**
   * The target for messages.
   * If no target is specified on an incoming link, then there is no target currently attached to the
   * link. A link with no target will never permit incoming messages.
   */
  target?: any;
  /**
   * Unsettled delivery state.
   * This is used to indicate any unsettled delivery states when a suspended link is resumed. The map
   * is keyed by delivery-tag with values indicating the delivery state. The local and remote delivery
   * states for a given delivery-tag MUST be compared to resolve any in-doubt deliveries. If necessary,
   * deliveries MAY be resent, or resumed based on the outcome of this comparison. See subsection 2.6.13.
   * If the local unsettled map is too large to be encoded within a frame of the agreed maximum frame
   * size then the session MAY be ended with the frame-size-too-small error. The endpoint SHOULD make
   * use of the ability to send an incomplete unsettled map (see below) to avoid sending an error.
   * The unsettled map MUST NOT contain null valued keys.
   * When reattaching (as opposed to resuming), the unsettled map MUST be null.
   */
  unsettled?: Record<string, any>;
  /**
   * If set to true this field indicates that the unsettled map provided is not complete.
   * When the map is incomplete the recipient of the map cannot take the absence of a delivery tag from
   * the map as evidence of settlement. On receipt of an incomplete unsettled map a sending endpoint
   * MUST NOT send any new deliveries (i.e. deliveries where resume is not set to true) to its partner
   * (and a receiving endpoint which sent an incomplete unsettled map MUST detach with an error on
   * receiving a transfer which does not have the resume flag set to true).
   * Note that if this flag is set to true then the endpoints MUST detach and reattach at least once in
   * order to send new deliveries. This flag can be useful when there are too many entries in the
   * unsettled map to fit within a single frame. An endpoint can attach, resume, settle, and detach
   * until enough unsettled state has been cleared for an attach where this flag is set to false.
   */
  incompleteUnsettled?: boolean;
  /**
   * The sender's initial value for delivery-count.
   * This MUST NOT be null if role is sender, and it is ignored if the role is receiver. See subsection 2.6.7.
   */
  initialDeliveryCount?: number;
  /**
   * The maximum message size supported by the link endpoint.
   * This field indicates the maximum message size supported by the link endpoint. Any attempt to
   * deliver a message larger than this results in a message-size-exceeded link-error. If this field is
   * zero or unset, there is no maximum size imposed by the link endpoint.
   */
  maxMessageSize?: number;
  /**
   * The extension capabilities the sender supports.
   * A registry of commonly defined link capabilities and their meanings is maintained
   * [AMQPLINKCAP](https://www.amqp.org/specification/1.0/link-capabilities).
   */
  offeredCapabilities?: string[];
  /**
   * The extension capabilities the sender can use if the receiver supports them.
   * The sender MUST NOT attempt to use any capability other than those it has declared in
   * desired-capabilities field.
   */
  desiredCapabilities?: string[];
  /**
   * Link properties.
   * The properties map contains a set of fields intended to indicate information about the link and its
   * container.
   * A registry of commonly defined link properties and their meanings is maintained
   * [AMQPLINKPROP](https://www.amqp.org/specification/1.0/link-properties).
   */
  properties?: Record<string, any>;
}
