/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Metrics } from '@mdf.js/core';

/** Metric types */
export type MetricInstances = {
  api_all_job_processed_total: Metrics.Counter;
  api_all_errors_job_processing_total: Metrics.Counter;
  api_all_job_in_processing_total: Metrics.Gauge;
  api_publishing_job_duration_milliseconds: Metrics.Histogram;
  api_publishing_job_throughput: Metrics.Histogram;
};
