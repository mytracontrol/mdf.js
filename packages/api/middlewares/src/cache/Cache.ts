/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import logger from '@mdf.js/logger';
import { Redis } from '@mdf.js/redis-provider';
import { coerce } from '@mdf.js/utils';
import cryto from 'crypto';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { OutgoingHttpHeaders } from 'http';
import { cloneDeep, merge } from 'lodash';
import { CacheConfig } from './CacheConfig.i';
import { CacheEntry } from './CacheEntry.t';
import { CacheRepository } from './CacheRepository';

const DEFAULT_CONFIG_CACHE_DURATION = 60;
const DEFAULT_CONFIG_CACHE_ENABLED = true;
const DEFAULT_CONFIG_CACHE_HEADERS_BLACK_LIST: string[] = [];
const DEFAULT_CONFIG_STATUS_CODES_EXCLUDED: number[] = [];
const DEFAULT_CONFIG_STATUS_CODES_INCLUDED: number[] = [200];
const DEFAULT_CONFIG_CACHE_PREFIX = 'api:cache:';
// *************************************************************************************************
// #region Cache configuration environment variables
const CONFIG_CACHE_DURATION = coerce(
  process.env['CONFIG_CACHE_DURATION'],
  DEFAULT_CONFIG_CACHE_DURATION
);
const CONFIG_CACHE_ENABLED = coerce(
  process.env['CONFIG_CACHE_ENABLED'],
  DEFAULT_CONFIG_CACHE_ENABLED
);
let CONFIG_STATUS_CODES_EXCLUDED: number[] = DEFAULT_CONFIG_STATUS_CODES_EXCLUDED;
let CONFIG_CACHE_HEADERS_BLACK_LIST: string[] = DEFAULT_CONFIG_CACHE_HEADERS_BLACK_LIST;
if (process.env['CONFIG_CACHE_HEADERS_BLACK_LIST']) {
  CONFIG_CACHE_HEADERS_BLACK_LIST = process.env['CONFIG_CACHE_HEADERS_BLACK_LIST'].split(',');
}
if (process.env['CONFIG_CACHE_STATUS_CODES_EXCLUDED']) {
  CONFIG_STATUS_CODES_EXCLUDED = process.env['CONFIG_CACHE_STATUS_CODES_EXCLUDED']
    .split(',')
    .map(entry => coerce(entry, 0));
}
let CONFIG_STATUS_CODES_INCLUDED: number[] = DEFAULT_CONFIG_STATUS_CODES_INCLUDED;
if (process.env['CONFIG_CACHE_STATUS_CODES_INCLUDED']) {
  CONFIG_STATUS_CODES_INCLUDED = process.env['CONFIG_CACHE_STATUS_CODES_INCLUDED']
    .split(',')
    .map(entry => coerce(entry, 0));
}
const CONFIG_CACHE_PREFIX = process.env['CONFIG_CACHE_PREFIX'] || DEFAULT_CONFIG_CACHE_PREFIX;
// #endregion

const DEFAULT_CONFIG_CACHE: CacheConfig = {
  duration: CONFIG_CACHE_DURATION,
  enabled: CONFIG_CACHE_ENABLED,
  headersBlacklist: CONFIG_CACHE_HEADERS_BLACK_LIST,
  statusCodes: {
    exclude: CONFIG_STATUS_CODES_EXCLUDED,
    include: CONFIG_STATUS_CODES_INCLUDED,
  },
  useBody: false,
  prefixKey: CONFIG_CACHE_PREFIX,
  toggle: () => true,
};

/** CacheRequest middleware */
export class Cache {
  /** Middleware class name */
  private readonly context: string = this.constructor.name;
  /** Cache repository */
  private readonly repository: CacheRepository;
  /** Cache options */
  private readonly options: CacheConfig;
  /**
   * Cache middleware instance
   * @param client - redis client
   * @returns
   */
  public static instance(client: Redis.Client, options?: Partial<CacheConfig>): Cache {
    return new Cache(new CacheRepository(client), options);
  }
  /**
   * Request cache middleware handler
   * @param provider - redis client
   * @param options - Cache options
   * @returns
   */
  public static handler(provider: Redis.Client, options?: Partial<CacheConfig>): RequestHandler {
    return new Cache(new CacheRepository(provider), options).handler(options);
  }
  /**
   * Create an instance of cache middleware
   * @param options - cache configuration options
   * @param repository - cache repository
   */
  private constructor(repository: CacheRepository, options?: Partial<CacheConfig>) {
    this.repository = repository;
    this.options = merge(cloneDeep(DEFAULT_CONFIG_CACHE), options);
  }
  /**
   * Cache middleware function
   * @param options - audit function
   * @returns
   */
  public handler(options?: Partial<CacheConfig>): RequestHandler {
    const localOptions = merge(cloneDeep(this.options), options);
    return (req: Request, res: Response, next: NextFunction) => {
      // Stryker disable next-line all
      logger.debug(`New request for path [${req.url}]`, req.uuid, this.context);
      if (req.headers['x-cache-bypass']) {
        next();
      } else {
        const cacheKey = this.cachePath(req, localOptions.prefixKey, localOptions.useBody);
        this.repository
          .getPath(cacheKey, req.uuid)
          .then((result: CacheEntry | null) => {
            if (result !== null) {
              this.useCacheResponse(localOptions, result, req, res);
            } else {
              this.setCacheResponse(cacheKey, localOptions, req, res, next);
            }
          })
          .catch((error: Error | Crash) => {
            // Stryker disable next-line all
            logger.error(`Error storing in cache path ${req.url}: ${error.message}`);
            next();
          });
      }
    };
  }
  /**
   * Use the cached response to fullfil the request
   * @param options - Cache options
   * @param request - HTTP request express object
   * @param response - HTTP response express object
   */
  private useCacheResponse(
    options: CacheConfig,
    cachedResponse: CacheEntry,
    request: Request,
    response: Response
  ): void {
    // Stryker disable next-line all
    logger.debug(`The response was cached`, request.uuid, this.context);
    // Stryker disable next-line all
    logger.silly(`${cachedResponse}`, request.uuid, this.context);
    this.removeCacheHeaders(response);
    const headers = this.filterHeaders(options.headersBlacklist, response.getHeaders());
    Object.assign(headers, cachedResponse.headers, {
      'cache-control': `max-age=${Math.max(
        0,
        cachedResponse.duration - (new Date().getTime() - cachedResponse.date) / 1000
      ).toFixed(0)}`,
    });
    response.set(headers);
    // file deep code ignore XSS: <This is cached response>
    response.status(cachedResponse.status).send(cachedResponse.body);
  }
  /**
   * Establish the cache response and store it in the data base
   * @param cacheKey - key that should be used to store the response
   * @param options - Cache options
   * @param request - HTTP request express object
   * @param response - HTTP response express object
   * @param next - Next express middleware function
   */
  private setCacheResponse(
    cacheKey: string,
    options: CacheConfig,
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    const wrappedSend = response.send.bind(response);
    response.send = (body: any): Response => {
      if (this.isIncluded(options, request, response)) {
        // Stryker disable next-line all
        logger.debug(`The response will be cached`, request.uuid, this.context);
        this.removeCacheHeaders(response);
        response.setHeader('cache-control', `max-age=${options.duration}`);
        const wrappedResponse = wrappedSend(body);
        const cacheEntry = {
          status: response.statusCode,
          headers: this.filterHeaders(options.headersBlacklist, response.getHeaders()),
          body,
          date: new Date().getTime(),
          duration: options.duration,
        };
        this.repository.setPath(cacheKey, cacheEntry, request.uuid).catch(error => {
          // Stryker disable all
          logger.error(
            `Error storing in cache path ${options.prefixKey + request.originalUrl}: ${
              error.message
            }`
          );
          // Stryker enable all
        });
        return wrappedResponse;
      } else {
        // Stryker disable next-line all
        logger.debug(`The response will NOT be cached`, request.uuid, this.context);
        return wrappedSend(body);
      }
    };
    next();
  }
  /**
   * Filter the response header based in the black list option
   * @param blackList - list of header that must not be stored
   * @param headers - header of the response object
   */
  private filterHeaders(blackList: string[], headers: OutgoingHttpHeaders): OutgoingHttpHeaders {
    return Object.fromEntries(
      Object.entries(headers).filter(header => !blackList.includes(header[0]))
    );
  }
  /** Remove cache headers */
  private removeCacheHeaders(res: Response): void {
    res.removeHeader('Surrogate-Control');
    res.removeHeader('Cache-Control');
    res.removeHeader('Pragma');
    res.removeHeader('Expires');
  }
  /**
   * Define if a response should be cached
   * @param options - Cache options to test against
   * @param req - Express request object
   * @param res - Express response object
   */
  private isIncluded(options: CacheConfig, req: Request, res: Response): boolean {
    const cachingEnabled = this.options.enabled && options.enabled;
    const toggled = options.toggle && options.toggle(req, res);

    const codes = options.statusCodes;
    const excluded = codes.exclude.length > 0 && codes.exclude.includes(res.statusCode);
    const included = codes.include.length > 0 && codes.include.includes(res.statusCode);
    return cachingEnabled && toggled && !excluded && included;
  }
  /**
   * Create the redis key path
   * @param request - HTTP request express object
   * @param prefixKey - redis prefix key
   * @param useBody - flag to indicate that the body must be used as part of the key
   * @returns
   */
  private cachePath(request: Request, prefixKey: string, useBody: boolean): string {
    let baseCacheKey = `${prefixKey}${request.originalUrl}`;
    if (useBody) {
      const hasher = cryto.createHash('sha1');
      const bodyString = JSON.stringify(request.body || {});
      const updatedPath = hasher.update(bodyString).digest('hex');
      baseCacheKey += `:${updatedPath}`;
    }
    return baseCacheKey;
  }
}
