/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
export const status = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'control.message.status.schema.json',
  title: 'Response status',
  description: 'An integer status code (similar to HTTP codes)',
  type: 'number',
  minimum: 100,
  maximum: 599,
};
