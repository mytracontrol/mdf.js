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
