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

import { Headers } from './Headers.i';
import { Status } from './Status.t';

export interface Object<Type extends string = string, Data = any> {
  /** Job type identification, used to identify specific job handlers to be applied */
  type?: Type;
  /** Job identification */
  jobId: string;
  /** Job payload */
  data: Data;
  /** Job meta information, used to pass specific information for sinks and sources */
  headers?: Headers;
  /** Job status */
  status: Status;
}
