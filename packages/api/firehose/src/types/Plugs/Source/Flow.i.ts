/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Jobs } from '@mdf.js/core';
import { Base } from './Base.i';

/**
 * Flow Source interface definition
 * A Flow is a Source that allows to manage the flow of Jobs using `init`/pause" methods to control
 * the rate of Jobs that can be processed
 */
export interface Flow<
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, any> = Jobs.AnyHeaders,
  CustomOptions extends Record<string, any> = Jobs.AnyOptions,
> extends Base<Type, Data, CustomHeaders, CustomOptions> {
  /** Enable consuming process */
  init(): void;
  /** Stop consuming process */
  pause(): void;
}

