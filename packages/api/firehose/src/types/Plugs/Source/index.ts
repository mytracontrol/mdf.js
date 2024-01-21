/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
export * from './CreditsFlow.i';
export * from './Flow.i';
export * from './Sequence.i';

import { CreditsFlow } from './CreditsFlow.i';
import { Flow } from './Flow.i';
import { Sequence } from './Sequence.i';

export type Any<
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, any> = Record<string, any>,
> =
  | Flow<Type, Data, CustomHeaders>
  | Sequence<Type, Data, CustomHeaders>
  | CreditsFlow<Type, Data, CustomHeaders>;
