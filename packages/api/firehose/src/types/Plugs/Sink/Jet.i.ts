/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Health } from '@mdf.js/core';
import { JobObject } from './JobObject.t';

export interface Jet<
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, any> = Record<string, any>
> extends Health.Component {
  /**
   * Perform the processing of a single Job
   * @param job - job to be processed
   */
  single: (job: JobObject<Type, Data, CustomHeaders>) => Promise<void>;
  /**
   * Perform the processing of several Jobs
   * @param jobs - jobs to be processed
   */
  multi: (jobs: JobObject<Type, Data, CustomHeaders>[]) => Promise<void>;
}
