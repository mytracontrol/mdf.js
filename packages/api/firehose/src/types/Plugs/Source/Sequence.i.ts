/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Jobs } from '@mdf.js/core';
import { Base } from './Base.i';
export interface Sequence<
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, any> = Record<string, any>,
> extends Base<Type, Data, CustomHeaders> {
  /**
   * Perform the ingestion of new jobs
   * @param size - Number of jobs to be ingested
   */
  ingestData(
    size: number
  ): Promise<
    Jobs.JobRequest<Type, Data, CustomHeaders> | Jobs.JobRequest<Type, Data, CustomHeaders>[]
  >;
}
