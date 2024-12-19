/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import type { Crash } from '@mdf.js/crash';
import type { DoneListener, Limiter, MetaData } from '@mdf.js/tasks';
import { Counter, Histogram, Registry } from 'prom-client';

/** Metric types */
type MetricInstances = {
  /** The total number of all jobs processed */
  jobsProcessed: Counter;
  /** The total number errors processing jobs */
  jobsWithError: Counter;
  /** File flinger jobs duration */
  jobsDuration: Histogram;
};

/** Metrics handler */
export class MetricsHandler {
  /** Metrics instances */
  private readonly metrics: MetricInstances;
  /** The registry to register the metrics */
  public registry: Registry;
  /**
   * Create an instance of MetricsHandler
   * @param limiter - The limiter instance to manage concurrency
   */
  constructor(private readonly limiter: Limiter) {
    this.registry = new Registry();
    this.registry.resetMetrics();
    this.metrics = this.defineMetrics(this.registry);
    this.limiter.on('done', this.onDoneEventHandler);
  }
  /** Update the job processing metrics of a file flinger */
  private readonly onDoneEventHandler: DoneListener = (
    uuid: string,
    result: any,
    meta: MetaData,
    error?: Crash
  ): void => {
    const type = meta.taskId;
    this.metrics.jobsProcessed.inc({ type });
    if (error) {
      this.metrics.jobsWithError.inc({ type });
    }
    if (meta.duration) {
      this.metrics.jobsDuration.observe({ type }, meta.duration);
    }
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
      jobsDuration: new Histogram({
        name: 'api_publishing_job_duration_milliseconds',
        help: 'Jobs duration',
        buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
        labelNames: ['type'],
        registers: [register],
      }),
    };
  }
}
