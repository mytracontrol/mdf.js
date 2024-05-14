/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { SASLCodes } from '../../../SASLCodes.t';
import { SASLFrame } from './SASLFrame.i';

/**
 * Outcome frame for SASL.
 * @see https://docs.oasis-open.org/amqp/core/v1.0/os/amqp-core-sasl-v1.0-os.html#type-outcome
 */
export interface Outcome extends SASLFrame {
  /** A reply-code indicating the outcome of the SASL dialog. */
  code: SASLCodes;
  /**
   * The additional-data field carries additional data on successful authentication outcome as
   * specified by the SASL specification [RFC4422]. If the authentication is unsuccessful, this
   * field is not set.
   */
  additionalData?: Buffer;
}
