/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
export const ipv6connection = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'control.message.command.target.ipv6connection.schema.json',
  title: 'IPv6 Connection',
  type: 'object',
  properties: {
    src_addr: {
      title: 'Source address',
      description: 'IPv6 source address range',
      $ref: 'control.message.command.target.ipv6net.schema.json#',
    },
    src_port: {
      title: 'Source port',
      description: 'Source service per RFC 6335',
      $ref: 'control.message.command.target.port.schema.json#',
    },
    dst_addr: {
      title: 'Destination address',
      description: 'IPv6 destination address range',
      $ref: 'control.message.command.target.ipv6net.schema.json#',
    },
    dst_port: {
      title: 'Destination port',
      description: 'Destination service per RFC 6335',
      $ref: 'control.message.command.target.port.schema.json#',
    },
    protocol: {
      description: 'Layer 4 protocol (e.g., TCP)',
      $ref: 'control.message.command.target.l4protocol.schema.json#',
    },
  },
  minProperties: 1,
  additionalProperties: false,
};
