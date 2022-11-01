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
