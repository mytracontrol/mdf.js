/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Mytra Control S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Mytra Control S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Mytra Control S.L.
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
