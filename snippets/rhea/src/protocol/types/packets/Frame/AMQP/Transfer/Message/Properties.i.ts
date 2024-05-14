/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Section } from './Section.i';

/**
 * AMQP Properties section for a message.
 * @see https://docs.oasis-open.org/amqp/core/v1.0/os/amqp-core-messaging-v1.0-os.html#type-properties
 * The properties section is used for a defined set of standard properties of the message. The
 * properties section is part of the bare message; therefore, if retransmitted by an intermediary,
 * it MUST remain unaltered.
 */
export interface Properties extends Section {
  /**
   * Message-id, if set, uniquely identifies a message within the message system. The message
   * producer is usually responsible for setting the message-id in such a way that it is assured to
   * be globally unique. A broker MAY discard a message as a duplicate if the value of the
   * message-id matches that of a previously received message sent to the same node.
   */
  messageId?: any;
  /**
   * The identity of the user responsible for producing the message. The client sets this value, and
   * it MAY be authenticated by intermediaries.
   */
  userId?: Buffer;
  /**
   * The to field identifies the node that is the intended destination of the message. On any given
   * transfer this might not be the node at the receiving end of the link.
   */
  to?: any;
  /** A common field for summary information about the message content and purpose. */
  subject?: string;
  /** The address of the node to send replies to. */
  replyTo?: any;
  /** This is a client-specific id that can be used to mark or identify messages between clients. */
  correlationId?: any;
  /**
   * The RFC-2046 [RFC2046] MIME type for the message's application-data section (body). As per
   * RFC-2046 [RFC2046] this can contain a charset parameter defining the character encoding used:
   * e.g., 'text/plain; charset="utf-8"'.
   * For clarity, as per section 7.2.1 of RFC-2616 [RFC2616], where the content type is unknown the
   * content-type SHOULD NOT be set. This allows the recipient the opportunity to determine the
   * actual type. Where the section is known to be truly opaque binary data, the content-type SHOULD
   * be set to application/octet-stream.
   * When using an application-data section with a section code other than data, content-type SHOULD
   * NOT be set.
   */
  contentType?: string;
  /**
   * The content-encoding property is used as a modifier to the content-type. When present, its value
   * indicates what additional content encodings have been applied to the application-data, and thus
   * what decoding mechanisms need to be applied in order to obtain the media-type referenced by the
   * content-type header field.
   * Content-encoding is primarily used to allow a document to be compressed without losing the
   * identity of its underlying content type.
   * Content-encodings are to be interpreted as per section 3.5 of RFC 2616 [RFC2616]. Valid
   * content-encodings are registered at IANA
   * [IANAHTTPPARAMS](https://www.iana.org/assignments/http-parameters/http-parameters.xml)
   *
   * The content-encoding MUST NOT be set when the application-data section is other than data. The
   * binary representation of all other application-data section types is defined completely in
   * terms of the AMQP type system.
   * Implementations MUST NOT use the identity encoding. Instead, implementations SHOULD NOT set
   * this property. Implementations SHOULD NOT use the compress encoding, except as to remain
   * compatible with messages originally sent with other protocols, e.g. HTTP or SMTP.
   * Implementations SHOULD NOT specify multiple content-encoding values except as to be compatible
   * with messages originally sent with other protocols, e.g. HTTP or SMTP.
   */
  contentEncoding?: string;
  /** An absolute time when this message is considered to be expired. */
  absoluteExpiryTime?: number;
  /** An absolute time when this message was created. */
  creationTime?: number;
  /** Identifies the group the message belongs to. */
  groupId?: string;
  /** The relative position of this message within its group. */
  groupSequence?: number;
  /**
   * This is a client-specific id that is used so that client can send replies to this message to a
   * specific group.
   */
  replyToGroupId?: string;
}
