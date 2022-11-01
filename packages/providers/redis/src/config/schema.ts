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
