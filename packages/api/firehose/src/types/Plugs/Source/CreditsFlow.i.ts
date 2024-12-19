/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Jobs } from '@mdf.js/core';
import { Base } from './Base.i';

/**
 * CreditsFlow Source interface definition
 * A CreditsFlow is a Source that allows to manage the flow of Jobs using a credit system to control
 * the rate of Jobs that can be processed
 */
export interface CreditsFlow<
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, any> = Jobs.AnyHeaders,
  CustomOptions extends Record<string, any> = Jobs.AnyOptions,
> extends Base<Type, Data, CustomHeaders, CustomOptions> {
  /**
   * Add new credits to the source
   * @param credits - Credits to be added to the source
   */
  addCredits(credits: number): Promise<number>;
}
