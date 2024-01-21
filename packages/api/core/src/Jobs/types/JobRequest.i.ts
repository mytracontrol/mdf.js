/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Options } from './Options.i';

export interface JobRequest<
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, any> = Record<string, any>,
> {
  /** Job type identification, used to identify specific job handlers to be applied */
  type?: Type;
  /** User job request identifier, defined by the user */
  jobUserId: string;
  /** Job payload */
  data: Data;
  /** Job meta information, used to pass specific information for job processors */
  options?: Options<CustomHeaders>;
}
