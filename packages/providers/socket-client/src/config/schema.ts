/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import Joi from 'joi';

export const schema = Joi.object({
  url: Joi.string().uri(),
  path: Joi.string(),
  transports: Joi.array().items(Joi.string()),
  ca: Joi.string(),
  cert: Joi.string(),
  key: Joi.string(),
}).unknown(true);
