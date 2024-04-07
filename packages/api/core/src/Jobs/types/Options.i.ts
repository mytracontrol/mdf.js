/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { AnyHeaders, Headers } from './Headers.i';

/** Any other extra option */
export type AnyOptions = Record<string, any>;

/** No more extra options information */
export interface NoMoreOptions {}

export interface DefaultOptions<CustomHeaders extends Record<string, any> = AnyHeaders> {
  /** Job meta information, used to pass specific information for jobs handlers */
  headers?: Headers<CustomHeaders>;
  /**
   * Indicates the number of handlers that must be successfully processed to consider the job as
   * successfully processed
   */
  numberOfHandlers?: number;
}

/** Job options */
export type Options<
  CustomHeaders extends Record<string, any> = AnyHeaders,
  CustomOptions extends Record<string, any> = AnyOptions,
> = DefaultOptions<CustomHeaders> & CustomOptions;
