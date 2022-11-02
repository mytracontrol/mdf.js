/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
export const artifact = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'control.message.command.target.artifact.schema.json',
  title: 'Artifact',
  type: 'object',
  properties: {
    mime_type: {
      title: 'Permitted values specified in the IANA Media Types registry, RFC 6838',
      type: 'string',
    },
    payload: { $ref: 'control.message.command.target.payload.schema.json#' },
    hashes: { $ref: 'control.message.command.target.hashes.schema.json#' },
  },
  additionalProperties: false,
};
