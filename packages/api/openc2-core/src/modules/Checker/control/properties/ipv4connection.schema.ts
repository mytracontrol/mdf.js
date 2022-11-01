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
export const ipv4connection = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'control.message.command.target.ipv4connection.schema.json',
  title: 'IPv4 Connection',
  type: 'object',
  properties: {
    src_addr: {
      title: 'Source address',
      description: 'IPv4 source address range',
      $ref: 'control.message.command.target.ipv4net.schema.json#',
    },
    src_port: {
      title: 'Source port',
      description: 'Source service per RFC 6335',
      $ref: 'control.message.command.target.port.schema.json#',
    },
    dst_addr: {
      title: 'Destination address',
      description: 'IPv4 destination address range',
      $ref: 'control.message.command.target.ipv4net.schema.json#',
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
