/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Jobs } from '@mdf.js/core';
import { ErrorRegistry } from '@mdf.js/error-registry';
import { LoggerInstance } from '@mdf.js/logger';
import { MetricsRegistry } from '@mdf.js/metrics-registry';
import { RetryOptions } from '@mdf.js/utils';
import { Plugs, PostConsumeOptions } from '.';

export interface FirehoseOptions<
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, any> = Record<string, any>
> {
  /** Firehose sources */
  sources: Plugs.Source.Any<Type, Data, CustomHeaders>[];
  /** Firehose sinks */
  sinks: Plugs.Sink.Any<Type, Data, CustomHeaders>[];
  /** Firehose transformation strategies per job type */
  strategies?: { [type: string]: Jobs.Strategy<Type, Data, CustomHeaders>[] };
  /** Retry options for sink/source operations */
  retryOptions?: RetryOptions;
  /** Post consume operation options */
  postConsumeOptions?: PostConsumeOptions;
  /** Buffer sizes */
  bufferSize?: number;
  /** Metrics registry service */
  metricsRegistry?: MetricsRegistry;
  /** Error registry service */
  errorsRegistry?: ErrorRegistry;
  /** Define the number of sinks that must confirm a job, default options is all of them */
  atLeastOne?: boolean;
  /** Logger instance for deep debugging tasks */
  logger?: LoggerInstance;
}
