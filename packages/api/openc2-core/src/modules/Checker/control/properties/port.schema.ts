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
export const port = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'control.message.command.target.port.schema.json',
  title: 'Port',
  description: 'Transport Protocol Port Number, RFC 6335',
  type: 'integer',
  minimum: 0,
  maximum: 65535,
};
