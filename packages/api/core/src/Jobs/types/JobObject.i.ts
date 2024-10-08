/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { AnyHeaders } from './Headers.i';
import { JobRequest } from './JobRequest.i';
import { AnyOptions } from './Options.i';
import { Status } from './Status.t';

/**
 * Job object
 * @category @mdf.js/core
 */
export interface JobObject<
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, any> = AnyHeaders,
  CustomOptions extends Record<string, any> = AnyOptions,
> extends JobRequest<Type, Data, CustomHeaders, CustomOptions> {
  /** Job type identification, used to identify specific job handlers to be applied */
  type: Type;
  /** Unique job processing identification */
  uuid: string;
  /**
   * Unique user job request identification, generated by UUID V5 standard and based on jobUserId
   */
  jobUserUUID: string;
  /** Job status */
  status: Status;
}
