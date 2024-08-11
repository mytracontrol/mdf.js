/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
export const to = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'control.message.to.schema.json',
  title: 'To',
  description: 'Authenticated identifier(s) of the authorized recipient(s) of a message',
  type: 'array',
  items: {
    type: 'string',
  },
};
