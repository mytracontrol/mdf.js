/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health } from '../..';

/** App resource definition */
export interface Resource extends Health.Component {
  /** Resource start function */
  start: () => Promise<void>;
  /** Resource stop function */
  stop: () => Promise<void>;
  /** Resource close function */
  close: () => Promise<void>;
}
