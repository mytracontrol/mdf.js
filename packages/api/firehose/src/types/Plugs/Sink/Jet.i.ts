/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Jobs } from '@mdf.js/core';
import { Base } from './Base.i';

export interface Jet<
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, any> = Jobs.AnyHeaders,
  CustomOptions extends Record<string, any> = Jobs.AnyOptions,
> extends Base<Type, Data, CustomHeaders, CustomOptions> {
  /**
   * Perform the processing of several Jobs
   * @param jobs - jobs to be processed
   */
  multi: (jobs: Jobs.JobObject<Type, Data, CustomHeaders, CustomOptions>[]) => Promise<void>;
}
