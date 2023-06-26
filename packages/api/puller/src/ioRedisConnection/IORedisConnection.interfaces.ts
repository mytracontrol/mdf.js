/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Redis } from 'ioredis';
import { Events } from '../events';

/** IORedisConnection options complete*/
export interface IORedisConnectionOptionsComplete {
  client: Redis | null;
  events: Events | null;
}

/** IORedisConnection options */
export interface IORedisConnectionOptions {
  client: Redis;
  events?: Events;
}

/** IORedis clients */
export interface IORedisClients {
  client: Redis;
  subscriber: Redis;
}
