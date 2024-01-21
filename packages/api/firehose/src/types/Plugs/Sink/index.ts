/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
export * from './Jet.i';
export * from './Tap.i';

import { Jet } from './Jet.i';
import { Tap } from './Tap.i';

export type Any<
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, any> = Record<string, any>,
> = Jet<Type, Data, CustomHeaders> | Tap<Type, Data, CustomHeaders>;
