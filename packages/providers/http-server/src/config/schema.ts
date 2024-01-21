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
}).unknown(true);
