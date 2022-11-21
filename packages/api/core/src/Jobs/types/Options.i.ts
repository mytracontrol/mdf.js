/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Headers } from './Headers.i';

export interface Options<CustomHeaders extends Record<string, any> = Record<string, any>> {
  /** Job meta information, used to pass specific information for sinks and sources */
  headers?: Headers<CustomHeaders>;
  /**
   * Indicates the quality of service for the job, indeed this indicate the number of sinks that
   * must be successfully processed to consider the job as successfully processed
   */
  qos?: number;
}
