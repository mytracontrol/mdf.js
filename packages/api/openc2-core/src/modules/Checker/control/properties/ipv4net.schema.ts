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
