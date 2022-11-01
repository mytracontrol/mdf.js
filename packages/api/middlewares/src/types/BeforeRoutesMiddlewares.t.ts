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

import { Audit } from '../audit';
import { AuthZ } from '../authz';
import { BodyParser } from '../bodyParser';
import { Cache } from '../cache';
import { Cors } from '../cors';
import { Security } from '../helmet';
import { Logger } from '../logger';
import { Metrics } from '../metrics';
import { Multer } from '../multer';
import { NoCache } from '../nocache';
import { RateLimiter } from '../rateLimiter';
import { RequestId } from '../requestId';

export type BeforeRoutesMiddlewares =
  | Audit
  | AuthZ
  | BodyParser
  | Cache
  | Cors
  | Security
  | Logger
  | Metrics
  | Multer
  | NoCache
  | RateLimiter
  | RequestId;
