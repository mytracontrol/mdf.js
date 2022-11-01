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
