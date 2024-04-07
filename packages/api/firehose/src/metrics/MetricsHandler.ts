/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Jobs } from '@mdf.js/core';
import { Counter, Gauge, Histogram, Registry } from 'prom-client';
import { Sources } from '../types';

/** Metric types */
type MetricInstances = {
  /** The total number of all jobs processed */
  jobsProcessed: Counter;
  /** The total number errors processing jobs */
  jobsWithError: Counter;
  /** Number of jobs actually processing */
  jobsInProcess: Gauge;
  /** Firehose jobs duration */
  jobsDuration: Histogram;
  /** Firehose throughput in bytes */
  jobsThroughput: Histogram;
};

/** Metrics handler */
export class MetricsHandler {
  /** Metrics instances */
  private readonly metrics: MetricInstances;
  /** The registry to register the metrics */
  public readonly registry: Registry;
  /** Create an instance of MetricsHandler */
  constructor() {
    this.registry = new Registry();
    this.registry.resetMetrics();
    this.metrics = this.defineMetrics(this.registry);
  }
  /**
   * Update the job processing metrics of a firehose
   * @param job - job to be managed
   */
  private readonly onJobEventHandler = (job: Jobs.JobHandler): void => {
    this.metrics.jobsInProcess.inc({ type: job.type });
    const size = Buffer.from(JSON.stringify(job.data), 'utf-8').byteLength;
    const onDoneHandler: (uuid: string, result: Jobs.Result) => void = (
      uuid: string,
      result: Jobs.Result
    ) => {
      this.metrics.jobsInProcess.dec({ type: job.type });
      if (result.hasErrors) {
        this.metrics.jobsWithError.inc({ type: job.type });
      } else {
        this.metrics.jobsProcessed.inc({ type: job.type });
      }
      const duration = job.processTime;
      this.metrics.jobsDuration.observe({ type: job.type }, duration);
      this.metrics.jobsThroughput.observe({ type: job.type }, size);
    };
    job.once('done', onDoneHandler);
  };
  /**
   * Define the metrics over a registry
   * @param register - The registry to register the metrics
   * @returns The metric instances
   */
  private defineMetrics(register: Registry): MetricInstances {
    return {
      jobsProcessed: new Counter({
        name: 'api_all_job_processed_total',
        help: 'The total number of all jobs processed',
        labelNames: ['type'],
        registers: [register],
      }),
      jobsWithError: new Counter({
        name: 'api_all_errors_job_processing_total',
        help: 'The total number errors processing jobs',
        labelNames: ['type'],
        registers: [register],
      }),
      jobsInProcess: new Gauge({
        name: 'api_all_job_in_processing_total',
        help: 'Number of jobs actually processing (no response yet)',
        labelNames: ['type'],
        registers: [register],
      }),
      jobsDuration: new Histogram({
        name: 'api_publishing_job_duration_milliseconds',
        help: 'Firehose jobs duration',
        buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
        labelNames: ['type'],
        registers: [register],
      }),
      jobsThroughput: new Histogram({
        name: 'api_publishing_throughput',
        help: 'Firehose throughput in bytes',
        buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
        labelNames: ['type'],
        registers: [register],
      }),
    };
  }
  /**
   * Register the metrics handler to a firehose source
   * @param source - Source to be managed
   */
  public enroll(source: Sources): void {
    source.on('job', this.onJobEventHandler);
  }
}
