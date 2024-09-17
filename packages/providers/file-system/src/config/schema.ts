/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import Joi from 'joi';

export const schema = Joi.object({
  presetFiles: Joi.array().items(Joi.string()),
  preset: Joi.string(),
  schemaFiles: Joi.array().items(Joi.string()),
  schema: Joi.string(),
  configFiles: Joi.array().items(Joi.string()),
  envPrefix: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string()), Joi.object()),

  readOptions: Joi.object({
    encoding: Joi.string().optional(),
    flag: Joi.string().optional(),
  }),
  writeOptions: Joi.object({
    mode: Joi.number().optional(),
    flag: Joi.string().optional(),
    flush: Joi.boolean().optional(),
    encoding: Joi.string().optional(),
  }),
  copyOptions: Joi.object({
    mode: Joi.number().optional(),
  }),
  readDirOptions: Joi.object({
    encoding: Joi.string().optional(),
    recursive: Joi.boolean().optional(),
  }),
}).unknown(true);
