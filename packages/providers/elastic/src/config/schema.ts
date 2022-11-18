/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import Joi from 'joi';

export const schema = Joi.object({
  node: Joi.string(),
  nodes: Joi.array().items(Joi.string()),
  maxRetries: Joi.number(),
  requestTimeout: Joi.number(),
  pingTimeout: Joi.number(),
  resurrectStrategy: Joi.string().valid('ping', 'optimistic', 'none'),
  ssl: Joi.object({
    ca: Joi.string(),
    cert: Joi.string(),
    key: Joi.string(),
    rejectUnauthorized: Joi.boolean(),
    servername: Joi.string(),
  }),
  name: Joi.string(),
  auth: Joi.object({
    username: Joi.string(),
    password: Joi.string(),
  }),
  proxy: Joi.string(),
}).unknown(true);
