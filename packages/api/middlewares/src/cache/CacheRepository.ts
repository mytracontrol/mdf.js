/**
 * Copyright 2020 Netin System S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Netin System S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Netin System S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Netin System S.L.
 */
import { Crash } from '@mdf/crash';
import logger from '@mdf/logger';
import { Redis } from '@mdf/redis-provider';
import { coerce } from '@mdf/utils';
import { CacheEntry } from './CacheEntry.t';

const RETRIEVING_ERROR = 'Error retrieving the information from the cache';
const DEFAULT_CONFIG_CACHE_EXPIRATION = 60;
// *************************************************************************************************
// #region Cache configuration environment variables
const CONFIG_CACHE_EXPIRATION = coerce(
  process.env['CONFIG_CACHE_EXPIRATION'],
  DEFAULT_CONFIG_CACHE_EXPIRATION
);
// #endregion

/** CacheRepository, cache repository management interface */
export class CacheRepository {
  /** Repository class name */
  readonly #context: string = this.constructor.name;
  /** Cache client */
  readonly #redis: Redis.Client;
  /**
   * Create an instance of CacheRepository
   * @param client - Redis client instance
   */
  constructor(client: Redis.Client) {
    this.#redis = client;
  }
  /**
   * Return the value of the previous response for the requested path if is present in the cache
   * @param path - Route path cached
   * @param uuid - Request identification, for trace propuse
   */
  getPath(path: string, uuid: string): Promise<CacheEntry | null> {
    // Stryker disable next-line all
    logger.debug(`New request for path ${path}`, uuid, this.#context);
    if (this.#redis.status !== 'ready') {
      return Promise.resolve(null);
    }
    return new Promise((resolve, reject) => {
      this.#redis
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
    logger.debug(`New request for path ${path}`, uuid, this.#context);
    // Stryker disable next-line all
    logger.silly(`${response}`, uuid, this.#context);
    if (this.#redis.status !== 'ready') {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      this.#redis
        .setex(path, response.duration || CONFIG_CACHE_EXPIRATION, JSON.stringify(response))
        .then((result: 'OK') => {
          // Stryker disable all
          logger.debug(
            `Path ${path} stored in cache with delay of ${
              response.duration || CONFIG_CACHE_EXPIRATION
            } seconds`,
            uuid,
            this.#context
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
