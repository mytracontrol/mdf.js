/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
export * from './Flow.i';
export * from './JobObject.t';
export * from './Sequence.i';

import { Flow } from './Flow.i';
import { Sequence } from './Sequence.i';

export type Any<
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, any> = Record<string, any>
> = Flow<Type, Data, CustomHeaders> | Sequence<Type, Data, CustomHeaders>;
