/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

export enum SASLMethods {
  /** Advertises the available SASL mechanisms that can be used for authentication. */
  MECHANISMS = 0x40,
  /** Selects the sasl mechanism and provides the initial response if needed. */
  INIT = 0x41,
  /** Send the SASL challenge data as defined by the SASL specification. */
  CHALLENGE = 0x42,
  /** Send the SASL response data as defined by the SASL specification. */
  RESPONSE = 0x43,
  /**
   * This frame indicates the outcome of the SASL dialog. Upon successful completion of the SASL
   * dialog the security layer has been established, and the peers MUST exchange protocol headers to
   * either start a nested security layer, or to establish the AMQP connection.
   */
  OUTCOME = 0x44,
}
