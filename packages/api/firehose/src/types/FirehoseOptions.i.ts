/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Jobs } from '@mdf.js/core';
import { LoggerInstance } from '@mdf.js/logger';
import { RetryOptions } from '@mdf.js/utils';
import { Plugs, PostConsumeOptions } from '.';

export interface FirehoseOptions<
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, any> = Jobs.AnyHeaders,
  CustomOptions extends Record<string, any> = Jobs.AnyOptions,
> {
  /** Firehose sources */
  sources: Plugs.Source.Any<Type, Data, CustomHeaders, CustomOptions>[];
  /** Firehose sinks */
  sinks: Plugs.Sink.Any<Type, Data, CustomHeaders, CustomOptions>[];
  /** Firehose transformation strategies per job type */
  strategies?: { [type: string]: Jobs.Strategy<Type, Data, CustomHeaders, CustomOptions>[] };
  /** Retry options for sink/source operations */
  retryOptions?: RetryOptions;
  /** Post consume operation options */
  postConsumeOptions?: PostConsumeOptions;
  /** Buffer sizes */
  bufferSize?: number;
  /** Define the number of sinks that must confirm a job, default options is all of them */
  atLeastOne?: boolean;
  /** Logger instance for deep debugging tasks */
  logger?: LoggerInstance;
  /** Maximum time of inactivity before the firehose notify that is hold */
  maxInactivityTime?: number;
}
