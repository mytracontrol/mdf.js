/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
export const device = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'control.message.command.target.device.schema.json',
  title: 'Device',
  type: 'object',
  properties: {
    hostname: {
      title: 'Hostname',
      description: 'A hostname that can be used to connect to this device over a network',
      type: 'string',
      format: 'hostname',
    },
    idn_hostname: {
      title: 'IDN',
      description:
        'An internationalized hostname that can be used to connect to this device over a network',
      type: 'string',
      //format: 'idn-hostname',
    },
    device_id: {
      title: 'Device identification',
      description:
        'An identifier that refers to this device within an inventory or management system',
      type: 'string',
    },
  },
  minProperties: 1,
  additionalProperties: false,
};
