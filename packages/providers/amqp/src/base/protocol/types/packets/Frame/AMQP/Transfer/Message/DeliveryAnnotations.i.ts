/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Section } from './Section.i';

/**
 * Delivery Annotations section for a message.
 * @see https://docs.oasis-open.org/amqp/core/v1.0/os/amqp-core-messaging-v1.0-os.html#type-delivery-annotations
 * The delivery-annotations section is used for delivery-specific non-standard properties at the
 * head of the message. Delivery annotations convey information from the sending peer to the
 * receiving peer. If the recipient does not understand the annotation it cannot be acted upon and
 * its effects (such as any implied propagation) cannot be acted upon. Annotations might be specific
 * to one implementation, or common to multiple implementations. The capabilities negotiated on link
 * attach and on the source and target SHOULD be used to establish which annotations a peer
 * supports. A registry of defined annotations and their meanings is maintained
 * [AMQPDELANN](https://www.amqp.org/specification/1.0/delivery-annotations)
 *
 * The symbolic key "rejected" is reserved for the use of communicating error information regarding
 * rejected messages. Any values associated with the "rejected" key MUST be of type error.
 *
 * If the delivery-annotations section is omitted, it is equivalent to a delivery-annotations
 * section containing an empty map of annotations.
 */
export interface DeliveryAnnotations extends Section {
  /** Delivery annotations */
  value: Record<string, unknown>;
}
