/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health } from '@mdf.js/core';
import { EventEmitter } from 'events';
import { Source } from './Plugs';

export interface WrappableSourcePlug<
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, any> = Record<string, any>
> extends EventEmitter,
    Health.Component {
  on(event: 'error' | 'data' | 'status', listener: (...args: any[]) => void): this;
  /**
   * Perform the task to clean the job registers after the job has been resolved
   * @param jobId - Job entry identification
   * @returns - the job entry identification that has been correctly removed or undefined if the job
   * was not found
   */
  postConsume: (jobId: string) => Promise<string | undefined>;
  /**
   * Perform the ingestion of new jobs
   * @param size - Number of jobs to be ingested
   */
  ingestData?: (
    size: number
  ) => Promise<
    Source.JobObject<Type, Data, CustomHeaders> | Source.JobObject<Type, Data, CustomHeaders>[]
  >;
}
