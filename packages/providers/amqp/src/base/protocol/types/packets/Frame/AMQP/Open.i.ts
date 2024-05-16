/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { AMQPFrame } from './AMQPFrame.i';

/**
 * The open frame is used to open a connection to a container.
 * @see https://docs.oasis-open.org/amqp/core/v1.0/os/amqp-core-transport-v1.0-os.html#type-open
 */
export interface Open extends AMQPFrame {
  /** Identifier of the source container */
  containerId: string;
  /**
   * Name of the target host
   * The name of the host (either fully qualified or relative) to which the sending peer is
   * connecting. It is not mandatory to provide the hostname. If no hostname is provided the
   * receiving peer SHOULD select a default based on its own configuration. This field can be used
   * by AMQP proxies to determine the correct back-end service to connect the client to.
   * This field MAY already have been specified by the sasl-init frame, if a SASL layer is used, or,
   * the server name indication extension as described in RFC-4366, if a TLS layer is used, in which
   * case this field SHOULD be null or contain the same value. It is undefined what a different
   * value to that already specified means.
   */
  hostname?: string;
  /**
   * The largest frame size that the sending peer is able to accept on this connection. If this
   * field is not set it means that the peer does not impose any specific limit. A peer MUST NOT
   * send frames larger than its partner can handle. A peer that receives an oversized frame MUST
   * close the connection with the framing-error error-code.
   * Both peers MUST accept frames of up to 512 (MIN-MAX-FRAME-SIZE) octets.
   * @default: 4294967295
   */
  maxFrameSize?: number;
  /**
   * The channel-max value is the highest channel number that can be used on the connection. This
   * value plus one is the maximum number of sessions that can be simultaneously active on the
   * connection. A peer MUST not use channel numbers outside the range that its partner can handle.
   * A peer that receives a channel number outside the supported range MUST close the connection
   * with the framing-error error-code.
   */
  channelMax?: number;
  /**
   * The idle timeout REQUIRED by the sender (see subsection 2.4.5). A value of zero is the same
   * as if it was not set (null). If the receiver is unable or unwilling to support the idle
   * time-out then it SHOULD close the connection with an error explaining why (e.g., because it is
   * too small).
   * If the value is not set, then the sender does not have an idle time-out. However, senders doing
   * this SHOULD be aware that implementations MAY choose to use an internal default to efficiently
   * manage a peer’s resources.
   */
  idleTimeout?: number;
  /**
   * A list of the locales that the peer supports for sending informational text. This includes
   * connection, session and link error descriptions. A peer MUST support at least the en-US locale
   * (see subsection 2.8.12 IETF Language Tag). Since this value is always supported, it need not be
   * supplied in the outgoing-locales. A null value or an empty list implies that only en-US is
   * supported.
   */
  outgoingLocales?: string[];
  /**
   * A list of locales that the sending peer permits for incoming informational text. This list is
   * ordered in decreasing level of preference. The receiving partner will choose the first (most
   * preferred) incoming locale from those which it supports. If none of the requested locales are
   * supported, en-US will be chosen. Note that en-US need not be supplied in this list as it is
   * always the fallback. A peer MAY determine which of the permitted incoming locales is chosen by
   * examining the partner’s supported locales as specified in the outgoing-locales field. A null
   * value or an empty list implies that only en-US is supported.
   */
  incomingLocales?: string[];
  /**
   * If the receiver of the offered-capabilities requires an extension capability which is not present
   * in the offered-capability list then it MUST close the connection.
   * A registry of commonly defined connection capabilities and their meanings is maintained
   * [AMQP-CONNCAP](https://www.amqp.org/specification/1.0/connection-capabilities)
   */
  offeredCapabilities?: string[];
  /**
   * The desired-capability list defines which extension capabilities the sender MAY use if the
   * receiver offers them (i.e., they are in the offered-capabilities list received by the sender of
   * the desired-capabilities). The sender MUST NOT attempt to use any capabilities it did not declare
   * in the desired-capabilities field. If the receiver of the desired-capabilities offers extension
   * capabilities which are not present in the desired-capabilities list it received, then it can be
   * sure those (undesired) capabilities will not be used on the connection.
   */
  desiredCapabilities?: string[];
  /**
   * The properties map contains a set of fields intended to indicate information about the connection
   * and its container.
   * A registry of commonly defined connection properties and their meanings is maintained
   * [AMQP-CONNPROP](https://www.amqp.org/specification/1.0/connection-properties)
   */
  properties?: Record<string, any>;
}
