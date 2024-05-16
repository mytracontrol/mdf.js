/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { SASLFrame } from './SASLFrame.i';

/**
 * A SASL response frame.
 * @see https://docs.oasis-open.org/amqp/core/v1.0/os/amqp-core-security-v1.0-os.html#type-sasl-response
 */
export interface Response extends SASLFrame {
  /**
   * A block of opaque data passed to the security mechanism. The contents of this data are defined
   * by the SASL security mechanism.
   */
  response: Buffer;
}
