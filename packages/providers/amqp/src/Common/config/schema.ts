/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import Joi from 'joi';

export const schema = Joi.object({
  username: Joi.string(),
  password: Joi.string(),
  host: Joi.string(),
  hostname: Joi.string(),
  port: Joi.number(),
  transport: Joi.string().valid('tls', 'ssl', 'tcp'),
  container_id: Joi.string(),
  id: Joi.string(),
  reconnect: Joi.alternatives().try(Joi.number(), Joi.string(), Joi.boolean()),
  reconnect_limit: Joi.number(),
  initial_reconnect_delay: Joi.number(),
  max_reconnect_delay: Joi.number(),
  max_frame_size: Joi.number(),
  non_fatal_errors: Joi.array().items(Joi.string()),
  key: Joi.string(),
  cert: Joi.string(),
  ca: Joi.string(),
  requestCert: Joi.boolean(),
  rejectUnauthorized: Joi.boolean(),
  receiver_options: Joi.object({
    name: Joi.string(),
    rcv_settle_mode: Joi.number().min(0).max(1),
    credit_window: Joi.number(),
    autoaccept: Joi.boolean(),
    autosettle: Joi.boolean(),
  }).unknown(true),
  sender_options: Joi.object({
    name: Joi.string(),
    snd_settle_mode: Joi.number().min(0).max(2),
    autosettle: Joi.boolean(),
  }).unknown(true),
  monitor: Joi.object({
    interval: Joi.number(),
    url: Joi.string().uri(),
    mbean: Joi.string(),
    brokerName: Joi.string(),
    address: Joi.string(),
    'routing-type': Joi.string(),
    queueName: Joi.string(),
    username: Joi.string(),
    password: Joi.string(),
    timeout: Joi.number(),
  }).unknown(true),
}).unknown(true);
