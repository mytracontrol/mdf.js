/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Settlement policy for a sender */
export enum SenderSettleMode {
  /** The sender will send all deliveries initially unsettled to the receiver. */
  Unsettled = 0,
  /** The sender will send all deliveries settled to the receiver. */
  Settled = 1,
  /** The sender MAY send a mixture of settled and unsettled deliveries to the receiver. */
  Mixed = 2,
}
