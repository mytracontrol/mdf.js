/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
export const requestId = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'control.message.requestId.schema.json',
  title: 'Request identification',
  description:
    'A unique identifier created by the Producer and copied by Consumer into all Responses',
  type: 'string',
};
