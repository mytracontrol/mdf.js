/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

export const target = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'control.message.command.target.schema.json',
  title: 'Target',
  description: 'he object of the Action. The Action is performed on the Target',
  type: 'object',
  properties: {
    artifact: {
      title: 'Artifact',
      description: 'An array of bytes representing a file-like object or a link to that object',
      $ref: 'control.message.command.target.artifact.schema.json#',
    },
    command: {
      title: 'Command',
      description: 'A reference to a previously issued Command',
      type: 'string',
    },
    device: {
      title: 'Device',
      description: 'The properties of a hardware device',
      $ref: 'control.message.command.target.device.schema.json#',
    },
    domain_name: {
      title: 'Domain name',
      description: 'A network domain name',
      type: 'string',
      format: 'hostname',
    },
    email_addr: {
      title: 'Email address',
      description: 'A single email address',
      type: 'string',
      format: 'email',
    },
    features: {
      title: 'Features',
      description:
        "A set of items used with the query Action to determine an Actuator's capabilities",
      type: 'array',
      uniqueItems: true,
      items: {
        title: 'Feature',
        type: 'string',
        enum: ['versions', 'profiles', 'pairs', 'rate_limit'],
      },
    },
    file: {
      title: 'File',
      description: 'Properties of a file',
      $ref: 'control.message.command.target.file.schema.json#',
    },
    idn_domain_name: {
      title: 'Internationalized domain name',
      description: 'An internationalized domain name',
      type: 'string',
      //format: 'idn-hostname',
    },
    idn_email_addr: {
      title: 'Internationalized email address',
      description: 'A single internationalized email address',
      type: 'string',
      //format: 'idn-email',
    },
    ipv4_connection: {
      title: 'IPv4 connection',
      description: 'A 5-tuple of source/dest IPv4 address, source/dest ports, and protocol',
      $ref: 'control.message.command.target.ipv4connection.schema.json#',
    },
    ipv6_connection: {
      title: 'IPv6 connection',
      description: 'A 5-tuple of source/dest IPv6 address, source/dest ports, and protocol',
      $ref: 'control.message.command.target.ipv6connection.schema.json#',
    },
    ipv4_net: {
      title: 'IPv4 net',
      description: 'An IPv4 address range including CIDR prefix length',
      $ref: 'control.message.command.target.ipv4net.schema.json#',
    },
    ipv6_net: {
      title: 'IPv6 net',
      description: 'An IPv6 address range including prefix length',
      $ref: 'control.message.command.target.ipv6net.schema.json#',
    },
    iri: {
      title: 'IRI',
      description: 'An internationalized resource identifier (IRI)',
      type: 'string',
      //format: 'iri',
    },
    mac_addr: {
      description: 'A Media Access Control (MAC) address - EUI-48 or EUI-64',
      type: 'string',
      pattern: '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$',
    },
    process: {
      title: 'Process',
      description:
        'Common properties of an instance of a computer program as executed on an operating system',
      $ref: 'control.message.command.target.process.schema.json#',
    },
    properties: {
      title: 'Properties',
      description: 'Data attribute associated with an Actuator',
      type: 'array',
      uniqueItems: true,
      items: {
        title: 'Property',
        type: 'string',
      },
    },
    uri: {
      title: 'URI',
      description: 'A uniform resource identifier(URI)',
      type: 'string',
      format: 'uri',
    },
  },
  patternProperties: {
    '^x-[A-Za-z0-9][A-Za-z0-9_]*:[A-Za-z0-9*][A-Za-z0-9_]*$': {
      $comment: 'Non-OASIS target extensions must start with x- and be separated by a colon',
      type: 'object',
    },
  },
  minProperties: 1,
  maxProperties: 1,
  additionalProperties: false,
};
