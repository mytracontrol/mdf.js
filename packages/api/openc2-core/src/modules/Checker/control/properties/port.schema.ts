/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
export const port = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'control.message.command.target.port.schema.json',
  title: 'Port',
  description: 'Transport Protocol Port Number, RFC 6335',
  type: 'integer',
  minimum: 0,
  maximum: 65535,
};
