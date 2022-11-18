/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Headers } from './Headers.i';
import { Status } from './Status.t';

export interface JobObject<Type extends string = string, Data = any> {
  /** Job type identification, used to identify specific job handlers to be applied */
  type: Type;
  /** Job identification */
  jobId: string;
  /** Job payload */
  data: Data;
  /** Job meta information, used to pass specific information for sinks and sources */
  headers?: Headers;
  /** Job status */
  status: Status;
}
