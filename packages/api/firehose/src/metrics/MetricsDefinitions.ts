/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { MetricConfig } from '@mdf.js/metrics-registry';

/** Jobs metrics for API */
export const JOBS_METRICS_DEFINITIONS: Record<string, MetricConfig> = {
  /** The total number of all jobs processed */
  api_all_job_processed_total: {
    type: 'Counter',
    name: 'api_all_job_processed_total',
    help: 'The total number of all jobs processed',
    labelNames: ['type'],
  },
  /** The total number errors processing jobs */
  api_all_errors_job_processing_total: {
    type: 'Counter',
    name: 'api_all_errors_job_processing_total',
    help: 'The total number errors processing jobs',
    labelNames: ['type'],
  },
  /** Number of jobs actually processing */
  api_all_job_in_processing_total: {
    type: 'Gauge',
    name: 'api_all_job_in_processing_total',
    help: 'Number of jobs actually processing (no response yet)',
    labelNames: ['type'],
  },
  /** Firehose jobs duration */
  api_publishing_job_duration_milliseconds: {
    type: 'Histogram',
    name: 'api_publishing_job_duration_milliseconds',
    help: 'Firehose jobs duration',
    buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
    labelNames: ['type'],
  },
  /** Firehose throughput in bytes */
  api_publishing_job_throughput: {
    type: 'Histogram',
    name: 'api_publishing_throughput',
    help: 'Firehose throughput in bytes',
    buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
    labelNames: ['type'],
  },
};
