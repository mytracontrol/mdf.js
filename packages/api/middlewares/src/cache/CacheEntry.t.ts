/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Possible type of values for outgoing headers */
type OutgoingHttpHeaderValue = number | string | string[] | undefined;

export type CacheEntry = {
  /** Status of response */
  status: number;
  /** Response headers */
  headers: {
    [x: string]: OutgoingHttpHeaderValue;
  };
  /** Response body */
  body: any;
  /** Cache entry date */
  date: number;
  /** Cache entry duration */
  duration: number;
};
