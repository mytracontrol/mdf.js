/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Template interface */
export interface Template {
  keys: (id: string) => string[];
  headers: string[];
  refresh_expiration: boolean;
  code: string;
}

/** Available Template headers */
export interface Headers {
  refs: string;
  validate_keys: string;
  validate_client: string;
  refresh_expiration: string;
  process_tick: string;
  conditions_check: string;
  get_time: string;
}
