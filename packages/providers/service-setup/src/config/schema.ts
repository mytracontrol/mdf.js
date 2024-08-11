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
}).unknown(true);
