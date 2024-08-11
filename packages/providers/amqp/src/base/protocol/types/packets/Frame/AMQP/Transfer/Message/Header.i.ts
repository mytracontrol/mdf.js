/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Section } from './Section.i';

/**
 * Transport headers for a message.
 * @see https://docs.oasis-open.org/amqp/core/v1.0/os/amqp-core-messaging-v1.0-os.html#type-header
 * The header section carries standard delivery details about the transfer of a message through the
 * AMQP network. If the header section is omitted the receiver MUST assume the appropriate default
 * values (or the meaning implied by no value being set) for the fields within the header unless
 * other target or node specific defaults have otherwise been set.
 */
export interface Header extends Section {
  /**
   * Specify durability requirements.
   * Durable messages MUST NOT be lost even if an intermediary is unexpectedly terminated and
   * restarted. A target which is not capable of fulfilling this guarantee MUST NOT accept messages
   * where the durable header is set to true: if the source allows the rejected outcome then the
   * message SHOULD be rejected with the precondition-failed error, otherwise the link MUST be
   * detached by the receiver with the same error.
   */
  durable?: boolean;
  /**
   * Relative message priority.
   * This field contains the relative message priority. Higher numbers indicate higher priority
   * messages. Messages with higher priorities MAY be delivered before those with lower priorities.
   * An AMQP intermediary implementing distinct priority levels MUST do so in the following manner:
   * If n distinct priorities are implemented and n is less than 10 -- priorities 0 to
   * (5 - ceiling(n/2)) MUST be treated equivalently and MUST be the lowest effective priority. The
   * priorities (4 + floor(n/2)) and above MUST be treated equivalently and MUST be the highest
   * effective priority. The priorities (5 - ceiling(n/2)) to (4 + floor(n/2)) inclusive MUST be
   * treated as distinct priorities.
   * If n distinct priorities are implemented and n is 10 or greater -- priorities 0 to (n - 1) MUST
   * be distinct, and priorities n and above MUST be equivalent to priority (n - 1).
   *
   * Thus, for example, if 2 distinct priorities are implemented, then levels 0 to 4 are equivalent,
   * and levels 5 to 9 are equivalent and levels 4 and 5 are distinct. If 3 distinct priorities are
   * implements the 0 to 3 are equivalent, 5 to 9 are equivalent and 3, 4 and 5 are distinct.
   *
   * This scheme ensures that if two priorities are distinct for a server which implements m
   * separate priority levels they are also distinct for a server which implements n different
   * priority levels where n > m.
   */
  priority?: number;
  /**
   * Time to live in ms.
   * Duration in milliseconds for which the message is to be considered "live". If this is set then a
   * message expiration time will be computed based on the time of arrival at an intermediary.
   * Messages that live longer than their expiration time will be discarded (or dead lettered). When
   * a message is transmitted by an intermediary that was received with a ttl, the transmitted
   * message's header SHOULD contain a ttl that is computed as the difference between the current
   * time and the formerly computed message expiration time, i.e., the reduced ttl, so that messages
   * will eventually die if they end up in a delivery loop.
   */
  ttl?: number;
  /**
   * If this value is true, then this message has not been acquired by any other link.
   * If this value is false, then this message MAY have previously been acquired by another link or
   * links.
   */
  firstAcquirer?: boolean;
  /**
   * The number of prior unsuccessful delivery attempts.
   * The number of unsuccessful previous attempts to deliver this message. If this value is non-zero
   * it can be taken as an indication that the delivery might be a duplicate. On first delivery, the
   * value is zero. It is incremented upon an outcome being settled at the sender, according to
   * rules defined for each outcome.
   */
  deliveryCount?: number;
}
