/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Audit } from './audit';
import { AuthZ } from './authz';
import { BodyParser } from './bodyParser';
import { Cache } from './cache';
import { Cors } from './cors';
import { Default } from './default';
import { ErrorHandler } from './errorHandler';
import { Security } from './helmet';
import { Logger } from './logger';
import { Metrics } from './metrics';
import { Multer } from './multer';
import { NoCache } from './nocache';
import { RateLimiter } from './rateLimiter';
import { RequestId } from './requestId';

export type {
  AfterRoutesMiddlewares,
  BeforeRoutesMiddlewares,
  EndpointsMiddlewares,
  Middlewares,
} from './types';

export type { Audit, AuditCategory, AuditConfig } from './audit';
export type { AuthZ, AuthZOptions } from './authz';
export type { BodyParser } from './bodyParser';
export type { Cache, CacheConfig } from './cache';
export type { Cors, CorsConfig } from './cors';
export type { Default } from './default';
export type { ErrorHandler } from './errorHandler';
export type { Security } from './helmet';
export type { Logger } from './logger';
export type { Metrics } from './metrics';
export type { Multer } from './multer';
export type { NoCache } from './nocache';
export type { RateLimitConfig, RateLimitEntry, RateLimiter } from './rateLimiter';
export type { RequestId } from './requestId';

export const Middleware = {
  Audit,
  AuthZ,
  BodyParser,
  Cache,
  Cors,
  Default,
  ErrorHandler,
  Security,
  Logger,
  Metrics,
  Multer,
  NoCache,
  RateLimiter,
  RequestId,
};
