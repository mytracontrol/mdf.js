/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Section } from './Section.i';

/**
 * Message Annotations section for a message.
 * @see https://docs.oasis-open.org/amqp/core/v1.0/os/amqp-core-messaging-v1.0-os.html#type-message-annotations
 * The message-annotations section is used for properties of the message which are aimed at the
 * infrastructure and SHOULD be propagated across every delivery step. Message annotations convey
 * information about the message. Intermediaries MUST propagate the annotations unless the
 * annotations are explicitly augmented or modified (e.g., by the use of the modified outcome).
 *
 * The capabilities negotiated on link attach and on the source and target can be used to establish
 * which annotations a peer understands; however, in a network of AMQP intermediaries it might not
 * be possible to know if every intermediary will understand the annotation. Note that for some
 * annotations it might not be necessary for the intermediary to understand their purpose, i.e.,
 * they could be used purely as an attribute which can be filtered on.
 *
 * A registry of defined annotations and their meanings is maintained
 * [AMQPMESSANN](https://www.amqp.org/specification/1.0/message-annotations).
 *
 * If the message-annotations section is omitted, it is equivalent to a message-annotations section
 * containing an empty map of annotations.
 */
export interface MessageAnnotations extends Section {
  /** The annotations */
  value: Record<string, unknown>;
}
