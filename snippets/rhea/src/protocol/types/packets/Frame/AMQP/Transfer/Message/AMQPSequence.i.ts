/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Section } from './Section.i';

/**
 * AMQP Sequence section for a message.
 * @see https://docs.oasis-open.org/amqp/core/v1.0/os/amqp-core-messaging-v1.0-os.html#type-amqp-sequence
 * An amqp-sequence section contains an arbitrary sequence of AMQP values of a single type.
 */
export interface AmqpSequence extends Section {
  /** The sequence */
  value: any[];
}
