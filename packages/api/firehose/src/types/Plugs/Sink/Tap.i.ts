/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Jobs } from '@mdf.js/core';
import { Base } from './Base.i';

/**
 * Tap Sink interface definition
 * A Tap is a Sink that only allows to manage one Job at a time using the `single` method
 */
export interface Tap<
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, any> = Jobs.AnyHeaders,
  CustomOptions extends Record<string, any> = Jobs.AnyOptions,
> extends Base<Type, Data, CustomHeaders, CustomOptions> {}
