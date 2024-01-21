/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Request, Response } from 'express';

/** Cache options interface */
export interface CacheConfig {
  /** Default duration in seconds. Default: 10 */
  duration: number;
  /** Enablement flag. Default: true */
  enabled: boolean;
  /** List of header that should not be cached */
  headersBlacklist: string[];
  /** List of status codes excluded and included */
  statusCodes: {
    /** Specifically Excluded status codes. Default: [] */
    exclude: number[];
    /** Specifically Included status codes. Default: [200] */
    include: number[];
  };
  /** Use request has as part of cache key */
  useBody: boolean;
  /** Prefix key */
  prefixKey: string;
  /**
   * Toggle cache function. Takes the request/objects and must return a boolean value. If true, the
   * response will be cached
   */
  toggle: (req: Request, res: Response) => boolean;
}
