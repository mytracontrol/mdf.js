/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { RetryOptions } from '@mdf.js/utils';

/** Represents the options for a job */
export interface JobOptions {
  /**
   * The priority of the job. A lower value means a higher priority. The default priority is 0.
   * @default 0
   */
  priority?: number;
  /**
   * The weight of the job, this define the number of tokens that the job will consume from the
   * bucket. The default weight is 1.
   * @default 1
   */
  weight?: number;
  /**
   * Job identifier, it necessary to identify the job in the limiter, mainly if the job is scheduled
   * to be retried. In that case, when the job is executed, the limiter will emit an event with the
   * job id.
   * @default If not provided, the job id will be generated automatically.
   */
  id?: string;
  /**
   * Set the options for the retry process of the job
   * @default undefined
   */
  retryOptions?: RetryOptions;
}
