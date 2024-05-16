/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { SASLFrame } from './SASLFrame.i';

/**
 * A SASL challenge frame.
 * @see https://docs.oasis-open.org/amqp/core/v1.0/os/amqp-core-security-v1.0-os.html#type-sasl-challenge
 */
export interface Challenge extends SASLFrame {
  /** Challenge information, a block of opaque binary data passed to the security mechanism. */
  challenge: Buffer;
}
