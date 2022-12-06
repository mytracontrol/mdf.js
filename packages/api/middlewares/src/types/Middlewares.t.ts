/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Audit } from '../audit';
import { AuthZ } from '../authz';
import { BodyParser } from '../bodyParser';
import { Cache } from '../cache';
import { Cors } from '../cors';
import { Default } from '../default';
import { ErrorHandler } from '../errorHandler';
import { Security } from '../helmet';
import { Logger } from '../logger';
import { Metrics } from '../metrics';
import { Multer } from '../multer';
import { NoCache } from '../nocache';
import { RateLimiter } from '../rateLimiter';
import { RequestId } from '../requestId';

export type Middlewares =
  | Audit
  | AuthZ
  | BodyParser
  | Cache
  | Cors
  | Default
  | ErrorHandler
  | Security
  | Logger
  | Metrics
  | Multer
  | NoCache
  | RateLimiter
  | RequestId;
