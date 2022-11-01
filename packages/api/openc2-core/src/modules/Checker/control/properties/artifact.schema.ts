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
