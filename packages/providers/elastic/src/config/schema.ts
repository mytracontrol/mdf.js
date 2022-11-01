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
