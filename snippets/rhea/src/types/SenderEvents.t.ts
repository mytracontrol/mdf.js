/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Events that can be emitted by a sender */
export enum SenderEvents {
  /** Raised when the sender has sufficient credit to be able to transmit messages to its peer. */
  sendable = 'sendable',
  /** Raised when the remote peer indicates the link is open (i.e., attached in AMQP parlance). */
  senderOpen = 'sender_open',
  /**
   * Raised when the remote peer requests that the sender drain its credit; sending all available
   * messages within the credit limit and ensuring credit is used up.
   */
  senderDraining = 'sender_draining',
  /** Raised when a flow is received for sender. */
  senderFlow = 'sender_flow',
  /**
   * Raised when the remote peer closes the sender with an error. The context may also have an
   * error property giving some information about the reason for the error.
   */
  senderError = 'sender_error',
  /** Raised when the remote peer indicates the link is closed. */
  senderClose = 'sender_close',
  /** Raised when a sent message is accepted by the peer. */
  accepted = 'accepted',
  /** Raised when a sent message is released by the peer. */
  released = 'released',
  /** Raised when a sent message is rejected by the peer. */
  rejected = 'rejected',
  /** Raised when a sent message is modified by the peer. */
  modified = 'modified',
  /** Raised when the sender link receives a disposition. */
  settled = 'settled',
}
