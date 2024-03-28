/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Metric, MetricObjectWithValues, MetricValue } from 'prom-client';
import { Config, InstancesObject, Response } from '.';

/** Metrics registry interface */
export interface Registry {
  /**
   * Configure several metrics in the aggregator an return an object with the metrics instances in
   * order to be able to use them in the application
   * @param metrics - Object with metrics configurations objects
   * @returns
   */
  setMetrics<
    T extends Record<string, Metric> | void = void,
    K extends Record<string, Config> = Record<string, Config>,
  >(
    metrics: K
  ): InstancesObject<T, K>;
  metrics(): Promise<Response>;
  /** Return the actual metrics in JSON format */
  metricsJSON(): Promise<Response>;
  /**
   * Remove a metric from the registry
   * @param name - name of the metric
   */
  removeMetric(name: string): void;
  /** Get a single metric from registry
   * @param name - name of metric
   */
  getMetric(name: string): Metric | undefined;
  /**
   * Get a single metric from registry
   * @param name - name of metric
   */
  getMetric(name: string): Metric | undefined;
  /**
   * Get a single metric value in Prometheus format
   * @param name - name of metric
   */
  getMetricAsString(name: string): Promise<string>;
  /**
   * Get a single metric value in JSON format
   * @param name - name of metric
   */
  getMetricAsJSON(name: string): Promise<MetricObjectWithValues<MetricValue<string>> | undefined>;
}
