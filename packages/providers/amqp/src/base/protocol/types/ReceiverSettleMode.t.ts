/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Settlement policy for a receiver */
export enum ReceiverSettleMode {
  /** The receiver will spontaneously settle all incoming transfers. */
  First = 0,
  /** The receiver will only settle after sending the disposition to the sender and receiving a disposition indicating settlement of the delivery from the sender. */
  Second = 1,
}
