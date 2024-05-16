/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

export enum MessageSectionCode {
  /** The header section */
  Header = 0x70,
  /** The delivery-annotations section */
  DeliveryAnnotations = 0x71,
  /** The message-annotations section */
  MessageAnnotations = 0x72,
  /** The properties section */
  Properties = 0x73,
  /** The application-properties section */
  ApplicationProperties = 0x74,
  /** The data section */
  Data = 0x75,
  /** The amqp-sequence section */
  AmqpSequence = 0x76,
  /** The amqp-value section */
  AmqpValue = 0x77,
  /** The footer section */
  Footer = 0x78,
}
