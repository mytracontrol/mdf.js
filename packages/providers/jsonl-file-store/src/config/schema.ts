/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import Joi from 'joi';

export const schema = Joi.object({
  writeOptions: Joi.object({
    mode: Joi.number().optional(),
    flag: Joi.string().optional(),
    flush: Joi.boolean().optional(),
    encoding: Joi.string().optional(),
  }),
  rotationOptions: Joi.object({
    interval: Joi.number().required(),
    openFilesFolderPath: Joi.string().required(),
    closedFilesFolderPath: Joi.string().required(),
    retryOptions: Joi.object({
      attempts: Joi.number(),
      timeout: Joi.number(),
    }).optional(),
  }),
}).unknown(true);
