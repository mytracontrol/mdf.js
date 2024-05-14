/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { SASLFrame } from './SASLFrame.i';

/**
 * A SASL mechanisms frame
 * @see https://docs.oasis-open.org/amqp/core/v1.0/os/amqp-core-security-v1.0-os.html#type-sasl-mechanisms
 */
export interface Mechanisms extends SASLFrame {
  /**
   * A list of the sasl security mechanisms supported by the sending peer. It is invalid for this
   * list to be null or empty. If the sending peer does not require its partner to authenticate with
   * it, then it SHOULD send a list of one element with its value as the SASL mechanism ANONYMOUS.
   * The server mechanisms are ordered in decreasing level of preference.
   */
  saslServerMechanisms: string[];
}
