/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Jobs } from '@mdf.js/core';
import { Service as MetricsService } from '@mdf.js/metrics-service';
import { Service as RegisterService } from '@mdf.js/register-service';
import { RetryOptions } from '@mdf.js/utils';
import { Plugs, PostConsumeOptions } from '.';

export interface FirehoseOptions<Type extends string = string, Data = any> {
  /** Firehose sources */
  sources: Plugs.Source.Any[];
  /** Firehose sinks */
  sinks: Plugs.Sink.Any[];
  /** Firehose transformation strategies per job type */
  strategies?: { [type: string]: Jobs.Strategy<Type, Data>[] };
  /** Retry options for sink/source operations */
  retryOptions?: RetryOptions;
  /** Post consume operation options */
  postConsumeOptions?: PostConsumeOptions;
  /** Buffer sizes */
  bufferSize?: number;
  /** Metrics service */
  metricsService?: MetricsService;
  /** Register service */
  registerService?: RegisterService;
  /** Define the number of sinks that must confirm a job, default options is all of them */
  atLeastOne?: boolean;
}
