/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { AnyHeaders } from './Headers.i';
import { AnyOptions, Options } from './Options.i';

export interface JobRequest<
  Type extends string = string,
  Data = unknown,
  CustomHeaders extends Record<string, any> = AnyHeaders,
  CustomOptions extends Record<string, any> = AnyOptions,
> {
  /** Job type identification, used to identify specific job handlers to be applied */
  type?: Type;
  /** User job request identifier, defined by the user */
  jobUserId: string;
  /** Job payload */
  data: Data;
  /** Job meta information, used to pass specific information for job processors */
  options?: Options<CustomHeaders, CustomOptions>;
}
