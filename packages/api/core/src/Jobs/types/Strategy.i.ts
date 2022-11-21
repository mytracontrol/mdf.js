/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { JobObject } from './JobObject.i';

/** Base class for strategies */
export interface Strategy<
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, unknown> = Record<string, unknown>
> {
  /** Strategy name */
  readonly name: string;
  /**
   * Perform the filter of the data based in concrete criteria
   * @param process - Data processing task object
   */
  do: (process: JobObject<Type, Data, CustomHeaders>) => JobObject<Type, Data, CustomHeaders>;
}
