/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { ReceiverSettleMode } from '../../../../ReceiverSettleMode.t';
import { AMQPFrame } from '../AMQPFrame.i';
import { Message } from './Message.i';

/**
 * Transfer a message.
 * @see https://docs.oasis-open.org/amqp/core/v1.0/os/amqp-core-transport-v1.0-os.html#type-transfer
 */
export interface Transfer extends AMQPFrame, Message {
  /** Specifies the link on which the message is transferred. */
  handle: number;
  /**
   * The delivery-id MUST be supplied on the first transfer of a multi-transfer delivery.
   * On continuation transfers the delivery-id MAY be omitted.
   * It is an error if the delivery-id on a continuation transfer differs from the delivery-id on
   * the first transfer of a delivery.
   */
  deliveryId?: number;
  /**
   * Uniquely identifies the delivery attempt for a given message on this link.
   * This field MUST be specified for the first transfer of a multi-transfer message and can only be
   * omitted for continuation transfers.
   * It is an error if the delivery-tag on a continuation transfer differs from the delivery-tag on
   * the first transfer of a delivery.
   */
  deliveryTag?: Buffer;
  /**
   * This field MUST be specified for the first transfer of a multi-transfer message and can only be
   * omitted for continuation transfers.
   * It is an error if the message-format on a continuation transfer differs from the message-format
   * on the first transfer of a delivery.
   */
  messageFormat?: number;
  /**
   * If not set on the first (or only) transfer for a (multi-transfer) delivery, then the settled
   * flag MUST be interpreted as being false.
   * For subsequent transfers in a multi-transfer delivery if the settled flag is left unset then it
   * MUST be interpreted as true if and only if the value of the settled flag on any of the
   * preceding transfers was true; if no preceding transfer was sent with settled being true then
   * the value when unset MUST be taken as false.
   * If the negotiated value for snd-settle-mode at attachment is settled, then this field MUST be
   * true on at least one transfer frame for a delivery (i.e., the delivery MUST be settled at the
   * sender at the point the delivery has been completely transferred).
   * If the negotiated value for snd-settle-mode at attachment is unsettled, then this field MUST be
   * false (or unset) on every transfer frame for a delivery (unless the delivery is aborted).
   */
  settled?: boolean;
  /**
   * Note that if both the more and aborted fields are set to true, the aborted flag takes
   * precedence.
   * That is, a receiver SHOULD ignore the value of the more field if the transfer is marked as
   * aborted.
   * A sender SHOULD NOT set the more flag to true if it also sets the aborted flag to true.
   */
  more?: boolean;
  /**
   * If first, this indicates that the receiver MUST settle the delivery once it has arrived without
   * waiting for the sender to settle first.
   * If second, this indicates that the receiver MUST NOT settle until sending its disposition to the
   * sender and receiving a settled disposition from the sender.
   * If not set, this value is defaulted to the value negotiated on link attach.
   */
  rcvSettleMode?: ReceiverSettleMode;
  /**
   * When set this informs the receiver of the state of the delivery at the sender.
   * This is particularly useful when transfers of unsettled deliveries are resumed after resuming a
   * link.
   * Setting the state on the transfer can be thought of as being equivalent to sending a disposition
   * immediately before the transfer performative, i.e., it is the state of the delivery (not the
   * transfer) that existed at the point the frame was sent.
   * Note that if the transfer performative (or an earlier disposition performative referring to the
   * delivery) indicates that the delivery has attained a terminal state, then no future transfer or
   * disposition sent by the sender can alter that terminal state.
   */
  state?: any;
  /**
   * If true, the resume flag indicates that the transfer is being used to reassociate an unsettled
   * delivery from a dissociated link endpoint.
   * The receiver MUST ignore resumed deliveries that are not in its local unsettled map.
   * The sender MUST NOT send resumed transfers for deliveries not in its local unsettled map.
   * If a resumed delivery spans more than one transfer performative, then the resume flag MUST be
   * set to true on the first transfer of the resumed delivery.
   * For subsequent transfers for the same delivery the resume flag MAY be set to true, or MAY be
   * omitted.
   * In the case where the exchange of unsettled maps makes clear that all message data has been
   * successfully transferred to the receiver, and that only the final state (and potentially
   * settlement) at the sender needs to be conveyed, then a resumed delivery MAY carry no payload and
   * instead act solely as a vehicle for carrying the terminal state of the delivery at the sender.
   */
  resume?: boolean;
  /**
   * Aborted messages SHOULD be discarded by the recipient (any payload within the frame carrying the
   * performative MUST be ignored).
   * An aborted message is implicitly settled.
   */
  aborted?: boolean;
  /**
   * If true, then the issuer is hinting that there is no need for the peer to urgently communicate
   * updated delivery state.
   * This hint MAY be used to artificially increase the amount of batching an implementation uses
   * when communicating delivery states, and thereby save bandwidth.
   * If the message being delivered is too large to fit within a single frame, then the setting of
   * batchable to true on any of the transfer performatives for the delivery is equivalent to setting
   * batchable to true for all the transfer performatives for the delivery.
   * The batchable value does not form part of the transfer state, and is not retained if a link is
   * suspended and subsequently resumed.
   */
  batchable?: boolean;
}
