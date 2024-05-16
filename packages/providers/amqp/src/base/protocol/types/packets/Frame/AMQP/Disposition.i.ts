/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Role } from '../../../Role.t';
import { AMQPFrame } from './AMQPFrame.i';

/**
 * Disposition frame for AMQP.
 * @see https://docs.oasis-open.org/amqp/core/v1.0/os/amqp-core-transport-v1.0-os.html#type-disposition
 */
export interface Disposition extends AMQPFrame {
  /**
   * The role identifies whether the disposition frame contains information about sending link
   * endpoints or receiving link endpoints.
   */
  role: Role;
  /** Identifies the lower bound of delivery-ids for the deliveries in this set. */
  first: number;
  /** Identifies the upper bound of delivery-ids for the deliveries in this set. */
  last?: number;
  /**
   * If true, indicates that the referenced deliveries are considered settled by the issuing
   * endpoint.
   */
  settled?: boolean;
  /** Communicates the state of all the deliveries referenced by this disposition. */
  state: any;
  /**
   * If true, then the issuer is hinting that there is no need for the peer to urgently communicate
   * the impact of the updated delivery states. This hint MAY be used to artificially increase the
   * amount of batching an implementation uses when communicating delivery states, and thereby save
   * bandwidth.
   */
  batchable?: boolean;
}
