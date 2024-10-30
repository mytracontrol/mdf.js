/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Jobs } from '@mdf.js/core';
import { Base } from './Base.i';

/**
 * Sequence Source interface definition
 * A Sequence is a Source that allows to manage the flow of Jobs using the `ingestData` method to control
 * the rate of Jobs that can be processed
 */
export interface Sequence<
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, any> = Jobs.AnyHeaders,
  CustomOptions extends Record<string, any> = Jobs.AnyOptions,
> extends Base<Type, Data, CustomHeaders, CustomOptions> {
  /**
   * Perform the ingestion of new jobs
   * @param size - Number of jobs to be ingested
   */
  ingestData(
    size: number
  ): Promise<
    | Jobs.JobRequest<Type, Data, CustomHeaders, CustomOptions>
    | Jobs.JobRequest<Type, Data, CustomHeaders, CustomOptions>[]
  >;
}
