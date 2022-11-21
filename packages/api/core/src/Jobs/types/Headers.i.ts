/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Standard headers that could be included in a Job */
export interface DefaultHeaders {
  /** Estimated time for job resolution */
  duration?: number;
}
/** Any  */
export interface AnyHeaders {
  /** Any other extra information */
  [header: string]: unknown;
}

export type Headers<T extends Record<string, any> = AnyHeaders> = DefaultHeaders & T;
