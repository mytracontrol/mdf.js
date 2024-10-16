/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import Joi from 'joi';
import { Config } from '../provider';

export const schema = Joi.object<Config>({
  propertyData: Joi.string(),
  propertyFileName: Joi.string(),
  defaultBaseFilename: Joi.string(),
  workingFolderPath: Joi.string(),
  archiveFolderPath: Joi.string(),
  createFolders: Joi.boolean(),
  inactiveTimeout: Joi.number().positive().integer(),
  fileEncoding: Joi.string(),
  rotationInterval: Joi.number().positive().integer(),
  rotationSize: Joi.number().positive().integer(),
  rotationLines: Joi.number().positive().integer(),
}).unknown(true);
