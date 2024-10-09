/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import Joi from 'joi';

export const schema = Joi.object({
  port: Joi.number().port(),
  host: Joi.alternatives().try(Joi.string().hostname(), Joi.string().ip()),
  db: Joi.number().min(0).max(15),
  family: Joi.number().positive().valid(4, 6),
  keepAlive: Joi.number().positive(),
  connectionName: Joi.string(),
  dropBufferSupport: Joi.boolean(),
  enableReadyCheck: Joi.boolean(),
  enableOfflineQueue: Joi.boolean(),
  connectTimeout: Joi.number().positive(),
  autoResubscribe: Joi.boolean(),
  autoResendUnfulfilledCommands: Joi.boolean(),
  lazyConnect: Joi.boolean(),
  retryStrategy: Joi.any(),
  reconnectOnError: Joi.any(),
  keyPrefix: Joi.string().empty(''),
  readOnly: Joi.boolean(),
  showFriendlyErrorStack: Joi.boolean(),
  enableAutoPipelining: Joi.boolean(),
  username: Joi.string().empty(''),
  password: Joi.string().empty(''),
  checkInterval: Joi.number().positive(),
  disableChecks: Joi.boolean(),
}).unknown(true);

