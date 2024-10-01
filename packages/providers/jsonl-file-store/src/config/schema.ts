/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import Joi from 'joi';

export const schema = Joi.object({
  openFilesFolderPath: Joi.string(),
  closedFilesFolderPath: Joi.string(),
  createFolders: Joi.boolean(),
  fileEncoding: Joi.string(),
  rotationInterval: Joi.number(),
  failOnStartSetup: Joi.boolean(),
  appendRetryOptions: Joi.object({
    timeout: Joi.number().optional(),
    attempts: Joi.number().optional(),
  }),
  rotationRetryOptions: Joi.object({
    timeout: Joi.number().optional(),
    attempts: Joi.number().optional(),
  }),
}).unknown(true);
