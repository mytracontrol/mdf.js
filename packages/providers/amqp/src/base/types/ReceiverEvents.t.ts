/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Events that can be emitted by a receiver. */
export enum ReceiverEvents {
  /** Raised when a message is received. */
  message = 'message',
  /** Raised when the remote peer indicates the link is open (i.e., attached in AMQP parlance). */
  receiverOpen = 'receiver_open',
  /**
   * Raised when the remote peer indicates that it has drained all credit (and therefore there are
   *  no more messages at present that it can send).
   */
  receiverDrained = 'receiver_drained',
  /** Raised when a flow is received for receiver. */
  receiverFlow = 'receiver_flow',
  /**
   * Raised when the remote peer closes the receiver with an error. The context may also have an
   * error property giving some information about the reason for the error.
   */
  receiverError = 'receiver_error',
  /** Raised when the remote peer indicates the link is closed. */
  receiverClose = 'receiver_close',
  /** Raised when the receiver link receives a disposition. */
  settled = 'settled',
}
