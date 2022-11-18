/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health } from '@mdf.js/core';
import { Sink } from './Plugs';

export interface WrappableSinkPlug<Type extends string = string, Data = any>
  extends Health.Component {
  /**
   * Perform the processing of a single Job
   * @param job - job to be processed
   */
  single: (job: Sink.JobObject<Type, Data>) => Promise<void>;
  /**
   * Perform the processing of several Jobs
   * @param jobs - jobs to be processed
   */
  multi?: (jobs: Sink.JobObject<Type, Data>[]) => Promise<void>;
}
