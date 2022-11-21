/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Jobs } from '@mdf.js/core';

export type JobObject<
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, any> = Record<string, any>
> = Omit<Jobs.JobObject<Type, Data, CustomHeaders>, 'status'>;
