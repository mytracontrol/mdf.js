/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Rate limit entry */
export interface RateLimitEntry {
  [x: string]: {
    /** Maximum number of requests */
    maxRequests: number;
    /** Time window in seconds */
    timeWindow: number;
  };
}

/** Rate limit configuration */
export interface RateLimitConfig {
  /** Enable rate limiting */
  enabled: boolean;
  /** Rate limits */
  rates: Array<RateLimitEntry>;
}
