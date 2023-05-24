/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import Joi from 'joi';

export const schema = Joi.object({
  url: Joi.string().uri(),
  serverSelectionTimeoutMS: Joi.number().integer().min(0),
  keepAlive: Joi.boolean(),
  keepAliveInitialDelay: Joi.number().integer().min(0),
  connectTimeoutMS: Joi.number().integer().min(0),
  socketTimeoutMS: Joi.number().integer().min(0),
  minPoolSize: Joi.number().integer().min(0),
  directConnection: Joi.boolean(),
  family: Joi.number().integer().allow(4, 6),
}).unknown(true);
