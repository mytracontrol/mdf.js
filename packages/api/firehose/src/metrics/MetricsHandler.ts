/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Jobs, Metrics } from '@mdf.js/core';
import { Sources } from '../types';
import { JOBS_METRICS_DEFINITIONS } from './MetricsDefinitions';
import { MetricInstances } from './MetricsInstances';

export class MetricsHandler {
  /**
   * Create metrics handler and enroll the firehose metrics over the metrics service
   * @param service - Metrics service interface
   * @returns
   */
  public static enroll(service: Metrics.Registry): MetricsHandler {
    return new MetricsHandler(service.setMetrics<MetricInstances>(JOBS_METRICS_DEFINITIONS));
  }
  /**
   * Create an instance of MetricsHandler
   * @param metrics - Metrics instances
   */
  private constructor(private readonly metrics: MetricInstances) {}
  /**
   * Update the job processing metrics of a firehose
   * @param job - job to be managed
   */
  private readonly onJobEventHandler = (job: Jobs.JobHandler<any, any, any>): void => {
    this.metrics.api_all_job_in_processing_total.inc({ type: job.type });
    const size = Buffer.from(JSON.stringify(job.data), 'utf-8').byteLength;
    const onDoneHandler: (uuid: string, result: Jobs.Result) => void = (
      uuid: string,
      result: Jobs.Result
    ) => {
      this.metrics.api_all_job_in_processing_total.dec({ type: job.type });
      if (result.hasErrors) {
        this.metrics.api_all_errors_job_processing_total.inc({ type: job.type });
      } else {
        this.metrics.api_all_job_processed_total.inc({ type: job.type });
      }
      const duration = job.processTime;
      this.metrics.api_publishing_job_duration_milliseconds.observe({ type: job.type }, duration);
      this.metrics.api_publishing_job_throughput.observe({ type: job.type }, size);
    };
    job.once('done', onDoneHandler);
  };
  /**
   * Register the metrics handler to a firehose source
   * @param source - Source to be managed
   */
  public register(source: Sources<any, any, any>): void {
    source.on('job', this.onJobEventHandler);
  }
}
