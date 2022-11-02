/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
export const ipv4net = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'control.message.command.target.ipv4net.schema.json',
  title: 'IPv4 Net',
  description: 'An IPv4 address range including CIDR prefix length',
  type: 'string',
  pattern:
    // eslint-disable-next-line max-len
    '^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\\/(\\d|[12]\\d|3[01]))?$',
};
