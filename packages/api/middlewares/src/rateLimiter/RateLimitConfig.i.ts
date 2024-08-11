/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

interface RateLimitEntry {
  [x: string]: {
    maxRequests: number;
    timeWindow: number;
  };
}
export interface RateLimitConfig {
  enabled: boolean;
  rates: Array<RateLimitEntry>;
}
