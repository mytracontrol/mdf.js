/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
export const payload = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'control.message.command.target.payload.schema.json',
  title: 'Payload',
  type: 'object',
  properties: {
    bin: {
      title: 'BIN',
      description: 'Specifies the data contained in the artifact',
      type: 'string',
      contentEncoding: 'base64',
    },
    url: {
      title: 'URL',
      description: 'MUST be a valid URL that resolves to the un-encoded content',
      type: 'string',
      format: 'uri',
    },
  },
  minProperties: 1,
  maxProperties: 1,
  additionalProperties: false,
};
