/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { StandardErrorCategories } from './StandardErrorCategories.t';

export interface BaseOptions {
  /** Name of the error, used as a category */
  name?: StandardErrorCategories;
  /** Extra information error */
  info?: {
    /** Subject to which the error relates */
    subject?: string;
    /** Date of the error */
    date?: Date;
    /** Any other relevant information */
    [x: string]: any;
  };
  /** Other key information from extends error */
  [x: string]: unknown;
}
