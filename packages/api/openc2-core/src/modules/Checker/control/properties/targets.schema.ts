/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
export const targets = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'control.message.response.targets.schema.json',
  title: 'List of targets',
  description: 'Enumeration of the targets',
  type: 'array',
  minItems: 1,
  uniqueItems: true,
  items: {
    title: 'Target',
    description: 'The object of the Action. The Action is performed on the Target',
    oneOf: [
      {
        type: 'string',
        enum: [
          'artifact',
          'command',
          'device',
          'domain_name',
          'email_addr',
          'idn_domain_name',
          'idn_email_addr',
          'features',
          'file',
          'ipv4_connection',
          'ipv6_connection',
          'ipv4_net',
          'ipv6_net',
          'iri',
          'mac_addr',
          'process',
          'properties',
          'uri',
        ],
      },
      { type: 'string', pattern: '^x-[A-Za-z0-9][A-Za-z0-9_]*:[A-Za-z0-9*][A-Za-z0-9_]*$' },
    ],
  },
};
