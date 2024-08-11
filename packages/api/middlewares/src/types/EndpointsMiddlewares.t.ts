/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Audit } from '../audit';
import { AuthZ } from '../authz';
import { Cache } from '../cache';
import { NoCache } from '../nocache';
import { RateLimiter } from '../rateLimiter';

export type EndpointsMiddlewares = Audit | AuthZ | Cache | NoCache | RateLimiter;
