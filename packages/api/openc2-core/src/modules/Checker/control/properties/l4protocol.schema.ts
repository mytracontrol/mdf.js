/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Mytra Control S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Mytra Control S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Mytra Control S.L.
 */
export const l4protocol = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'control.message.command.target.l4protocol.schema.json',
  title: 'L4 protocol',
  description: 'Value of the protocol (IPv4) or next header (IPv6) field in an IP packet',
  type: 'string',
  enum: ['icmp', 'tcp', 'udp', 'sctp'],
};
