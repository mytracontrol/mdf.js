/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { AmqpSequence } from './Message/AMQPSequence.i';
import { AmqpValue } from './Message/AMQPValue.i';
import { Data } from './Message/Data.i';
import { Header } from './Message/Header.i';

export interface Message {
  /**
   * The header section carries standard delivery details about the transfer of a message through
   * the AMQP network. If the header section is omitted the receiver MUST assume the appropriate
   * default values (or the meaning implied by no value being set) for the fields within the header
   * unless other target or node specific defaults have otherwise been set.
   */
  header?: Header;
  /**
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
  deliveryAnnotations?: Record<string, unknown>;
  /**
   * The message-annotations section is used for properties of the message which are aimed at the
   * infrastructure for the message and at the receiving application. Message annotations convey
   * information not conveyed by the application properties, but which may further qualify the
   * context of the message.
   *
   * A registry of defined annotations and their meanings is maintained
   * [AMQPMSGANN](https://www.amqp.org/specification/1.0/message-annotations)
   *
   * If the message-annotations section is omitted, it is equivalent to a message-annotations section
   * containing an empty map of annotations.
   */
  messageAnnotations?: Record<string, unknown>;
  /**
   * The properties section is used for a defined set of standard properties of the message. The
   * properties section is part of the bare message; therefore, if retransmitted by an intermediary,
   * it MUST remain unaltered.
   */
  properties?: Record<string, unknown>;
  /**
   * The application-properties section is a part of the bare message and allows for application
   * specific message properties to be included in the message.
   */
  applicationProperties?: Record<string, unknown>;
  /**
   * The body section is used to convey the actual application data as a byte array. The meaning of
   * the byte array is described by the content-type field.
   */
  body?: Data | Data[] | AmqpSequence | AmqpSequence[] | AmqpValue;
  /**
   * The footer section is used for details about the message or delivery which can only be calculated
   * or constructed after the message has been constructed.
   */
  footer?: Record<string, unknown>;
}
