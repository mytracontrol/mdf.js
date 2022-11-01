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
export const file = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'control.message.command.target.file.schema.json',
  title: 'File',
  type: 'object',
  properties: {
    name: {
      title: 'Name',
      description: 'The name of the file as defined in the file system',
      type: 'string',
      format: 'hostname',
    },
    path: {
      title: 'Path',
      description: 'The absolute path to the location of the file in the file system',
      type: 'string',
    },
    hashes: {
      title: 'Hashes',
      description: 'One or more cryptographic hash codes of the file contents',
      $ref: 'control.message.command.target.hashes.schema.json#',
    },
  },
  minProperties: 1,
  additionalProperties: false,
};
