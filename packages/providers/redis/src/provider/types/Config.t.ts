/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { RedisOptions } from 'ioredis';

export type Config = Omit<RedisOptions, 'keepAlive'> & {
  keepAlive?: number;
  checkInterval?: number;
  disableChecks?: boolean;
};
