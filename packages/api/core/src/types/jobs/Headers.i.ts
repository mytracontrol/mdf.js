/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Routing } from './Routing.i';

export interface Headers {
  /** Routing information, used to select the correct sink */
  routing?: Routing;
  /** Estimated time of resolve */
  duration?: number;
  /** Any other extra information */
  [header: string]: unknown;
}
