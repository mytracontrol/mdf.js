/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
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
