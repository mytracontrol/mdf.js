/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Netin System S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Netin System S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Netin System S.L.
 */
import { BoomHelpers } from '@mdf.js/crash';
import { RequestHandler } from 'express';
import RateLimit from 'express-rate-limit';
import { RateLimitConfig } from './RateLimitConfig.i';
const MINUTE = 60000;

/** RateLimiter class manages the API requests rate limits */
export class RateLimiter {
  /** Rate limiters configuration */
  readonly #config: RateLimitConfig;
  /** Flag that indicates that the rates limiters are enabled */
  readonly #enable: boolean;
  /** Rate limiters map */
  readonly #RateLimiterMap: Map<string, RequestHandler> = new Map();
  /** Empty rate limiter */
  readonly #emptyMiddleware: RequestHandler = (req, res, next) => {
    next();
  };
  /**
   * Create an instance of RateLimiter
   * @param configuration - Rate limiters configuration
   */
  constructor(configuration: RateLimitConfig) {
    this.#config = configuration;
    this.#enable = this.#config.enabled;
    if (this.#config.rates && this.#config.rates.length) {
      this.#config.rates.forEach((rate: any) => {
        const label = Object.keys(rate)[0];
        const handler = this.requestHandler(rate[label].maxRequests, rate[label].timeWindow);
        this.#RateLimiterMap.set(label, handler);
      });
    } else {
      this.#enable = false;
    }
  }
  /** Create a request handler for a rate limiter */
  private requestHandler(maxRequests: number, timeWindow: number): RequestHandler {
    return RateLimit({
      max: maxRequests,
      windowMs: timeWindow * MINUTE,
      headers: true,
      handler: (req, res, next) => {
        next(
          BoomHelpers.tooManyRequests('Too many requests, please try again later', req.uuid, {
            source: {
              pointer: req.path,
              parameter: req.body,
            },
          })
        );
      },
      skipFailedRequests: false,
      skipSuccessfulRequests: false,
    });
  }
  /** Get the request handler */
  public get(label: string): RequestHandler {
    const result = this.#RateLimiterMap.get(label);
    if (result && this.#enable) {
      return result;
    } else {
      return this.#emptyMiddleware;
    }
  }
}
