/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Base } from './Base.i';
import { JobObject } from './JobObject.t';
export interface Sequence<
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, unknown> = Record<string, unknown>
> extends Base<Type, Data, CustomHeaders> {
  /**
   * Perform the ingestion of new jobs
   * @param size - Number of jobs to be ingested
   */
  ingestData(
    size: number
  ): Promise<JobObject<Type, Data, CustomHeaders> | JobObject<Type, Data, CustomHeaders>[]>;
}
