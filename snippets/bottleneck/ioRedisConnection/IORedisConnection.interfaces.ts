/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import EventEmitter from 'events';
import { Redis } from 'ioredis';

/** IORedisConnection options complete*/
export interface IORedisConnectionOptionsComplete {
  client: Redis | null;
  events: EventEmitter | null;
}

/** IORedisConnection options */
export interface IORedisConnectionOptions {
  client: Redis;
  events?: EventEmitter;
}

/** IORedis clients */
export interface IORedisClients {
  client: Redis;
  subscriber: Redis;
}
