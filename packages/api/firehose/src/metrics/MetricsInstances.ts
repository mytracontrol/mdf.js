/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Counter, Gauge, Histogram } from '@mdf.js/metrics-registry';

/** Metric types */
export type MetricInstances = {
  api_all_job_processed_total: Counter;
  api_all_errors_job_processing_total: Counter;
  api_all_job_in_processing_total: Gauge;
  api_publishing_job_duration_milliseconds: Histogram;
  api_publishing_job_throughput: Histogram;
};
