/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Section } from './Section.i';

/**
 * Footer section for a message.
 * @see https://docs.oasis-open.org/amqp/core/v1.0/os/amqp-core-messaging-v1.0-os.html#type-footer
 * The footer section is used for details about the message or delivery which can only be calculated
 * or evaluated once the whole bare message has been constructed or seen (for example message
 * hashes, HMACs, signatures and encryption details).
 */
export interface Footer extends Section {
  /** Footer section content */
  value: Record<string, unknown>;
}
