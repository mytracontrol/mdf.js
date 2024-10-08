/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
export const l4protocol = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'control.message.command.target.l4protocol.schema.json',
  title: 'L4 protocol',
  description: 'Value of the protocol (IPv4) or next header (IPv6) field in an IP packet',
  type: 'string',
  enum: ['icmp', 'tcp', 'udp', 'sctp'],
};
