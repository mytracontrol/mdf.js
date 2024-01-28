/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Crash } from '@mdf.js/crash';
import logger from '@mdf.js/logger';
import { Redis } from '@mdf.js/redis-provider';
import { CacheEntry } from './CacheEntry.t';

const RETRIEVING_ERROR = 'Error retrieving the information from the cache';
const DEFAULT_CONFIG_CACHE_EXPIRATION = 60;

/** CacheRepository, cache repository management interface */
export class CacheRepository {
  /** Repository class name */
  private readonly context: string = this.constructor.name;
  /** Cache client */
  private readonly redis: Redis.Client;
  /**
   * Create an instance of CacheRepository
   * @param client - Redis client instance
   */
  constructor(client: Redis.Client) {
    this.redis = client;
  }
  /**
   * Return the value of the previous response for the requested path if is present in the cache
   * @param path - Route path cached
   * @param uuid - Request identification, for trace propuse
   */
  getPath(path: string, uuid: string): Promise<CacheEntry | null> {
    // Stryker disable next-line all
    logger.debug(`New request for path ${path}`, uuid, this.context);
    if (this.redis.status !== 'ready') {
      return Promise.resolve(null);
    }
    return new Promise((resolve, reject) => {
      this.redis
        .get(path)
        .then((result: string | null) => {
          if (typeof result !== 'string') {
            resolve(null);
          } else {
            resolve(JSON.parse(result));
          }
        })
        .catch((error: Error) => {
          reject(new Crash(RETRIEVING_ERROR, uuid, { cause: error }));
        });
    });
  }
  /**
   * Return the value of the previous response for the requested path if is present in the cache
   * @param path - Route path cached
   * @param response - Response to store in the cache, must be a string
   * @param uuid - Request identification, for trace propuse
   */
  setPath(path: string, response: CacheEntry, uuid: string): Promise<void> {
    // Stryker disable next-line all
    logger.debug(`New request for path ${path}`, uuid, this.context);
    // Stryker disable next-line all
    logger.silly(`${response}`, uuid, this.context);
    if (this.redis.status !== 'ready') {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      this.redis
        .setex(path, response.duration || DEFAULT_CONFIG_CACHE_EXPIRATION, JSON.stringify(response))
        .then((result: 'OK') => {
          // Stryker disable all
          logger.debug(
            `Path ${path} stored in cache with delay of ${
              response.duration || DEFAULT_CONFIG_CACHE_EXPIRATION
            } seconds`,
            uuid,
            this.context
          );
          // Stryker enable all
          resolve();
        })
        .catch((error: Error) => {
          reject(new Crash(RETRIEVING_ERROR, uuid, { cause: error }));
        });
    });
  }
}
