/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { IORedisConnectionOptionsComplete } from '.';

/** Default values for IORedisConnection */
export const IO_REDIS_CONNECTION_DEFAULTS: IORedisConnectionOptionsComplete = {
  client: null,
  events: null,
};
