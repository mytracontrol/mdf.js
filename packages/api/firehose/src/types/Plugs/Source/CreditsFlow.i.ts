/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Base } from './Base.i';

export interface CreditsFlow<
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, any> = Record<string, any>
> extends Base<Type, Data, CustomHeaders> {
  /**
   * Add new credits to the source
   * @param credits - Credits to be added to the source
   */
  addCredits(credits: number): void;
}
