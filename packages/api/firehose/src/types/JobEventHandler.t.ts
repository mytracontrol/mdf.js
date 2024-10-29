/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Jobs } from '@mdf.js/core';

/** Firehose `job` event handler */
export type JobEventHandler<
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, any> = Jobs.NoMoreHeaders,
  CustomOptions extends Record<string, any> = Jobs.NoMoreOptions,
> = (job: Jobs.JobObject<Type, Data, CustomHeaders, CustomOptions>) => void;
