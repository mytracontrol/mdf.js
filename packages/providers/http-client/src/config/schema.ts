/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import Joi from 'joi';

export const schema = Joi.object({
  requestConfig: Joi.object({
    baseURL: Joi.string().uri(),
    timeout: Joi.number().integer().min(0),
    auth: Joi.object({
      username: Joi.string(),
      password: Joi.string(),
    }),
  }).unknown(true),
  httpAgentOptions: Joi.object({
    keepAlive: Joi.boolean(),
    keepAliveInitialDelay: Joi.number().integer().min(0),
    keepAliveMsecs: Joi.number().integer().min(0),
    maxSockets: Joi.number().integer().min(0),
    maxTotalSockets: Joi.number().integer().min(0),
    maxFreeSockets: Joi.number().integer().min(0),
  }).unknown(true),
  httpsAgentOptions: Joi.object({
    keepAlive: Joi.boolean(),
    keepAliveInitialDelay: Joi.number().integer().min(0),
    keepAliveMsecs: Joi.number().integer().min(0),
    maxSockets: Joi.number().integer().min(0),
    maxTotalSockets: Joi.number().integer().min(0),
    maxFreeSockets: Joi.number().integer().min(0),
    rejectUnauthorized: Joi.boolean(),
    ca: Joi.string(),
    cert: Joi.string(),
    key: Joi.string(),
  }).unknown(true),
}).unknown(true);

