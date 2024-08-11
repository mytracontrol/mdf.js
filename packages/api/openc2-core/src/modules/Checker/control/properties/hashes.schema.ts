/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
export const hashes = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'control.message.command.target.hashes.schema.json',
  title: 'Hashes',
  type: 'object',
  properties: {
    md5: {
      title: 'MD5',
      description: 'MD5 hash as defined in RFC 1321',
      type: 'string',
      contentEncoding: 'base64',
    },
    sha1: {
      title: 'SHA1',
      description: 'SHA1 hash as defined in RFC 6234',
      type: 'string',
      contentEncoding: 'base64',
    },
    sha256: {
      title: 'SHA256',
      description: 'SHA256 hash as defined in RFC 6234',
      type: 'string',
      contentEncoding: 'base64',
    },
  },
  minProperties: 1,
  additionalProperties: false,
};
