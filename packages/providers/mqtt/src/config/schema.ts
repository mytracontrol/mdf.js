/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import Joi from 'joi';

export const schema = Joi.object({
  url: Joi.string().uri().required(),
  protocol: Joi.string().valid(
    'wss',
    'ws',
    'mqtt',
    'mqtts',
    'tcp',
    'ssl',
    'wx',
    'wxs',
    'ali',
    'alis'
  ),
  resubscribe: Joi.boolean(),
  keepalive: Joi.number().integer().min(1).max(65535),
  username: Joi.string(),
  password: Joi.string(),
  clientId: Joi.string(),
  ca: Joi.string(),
  cert: Joi.string(),
  key: Joi.string(),
}).unknown(true);
