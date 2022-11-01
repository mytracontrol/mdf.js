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

import { Jobs } from '@mdf/core';
import { Service as MetricsService } from '@mdf/metrics-service';
import { Service as RegisterService } from '@mdf/register-service';
import { RetryOptions } from '@mdf/utils';
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
