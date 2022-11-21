/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Base } from './Base.i';

export interface Flow<
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, unknown> = Record<string, unknown>
> extends Base<Type, Data, CustomHeaders> {
  /** Enable consuming process */
  init(): void;
  /** Stop consuming process */
  pause(): void;
}
