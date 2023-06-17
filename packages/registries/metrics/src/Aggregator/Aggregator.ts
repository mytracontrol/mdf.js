/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Crash } from '@mdf.js/crash';
import {
  AggregatorRegistry as ClusterRegistry,
  Counter,
  CounterConfiguration,
  Gauge,
  GaugeConfiguration,
  Histogram,
  HistogramConfiguration,
  Metric,
  MetricObjectWithValues,
  MetricValue,
  Registry,
  Summary,
  SummaryConfiguration,
  collectDefaultMetrics,
} from 'prom-client';
import { v4 } from 'uuid';
import { METRIC_TYPES, MetricConfig, MetricInstancesObject, MetricsResponse } from '../types';

/** MetricsAggregator, management of all the metrics for this artifact */
export class Aggregator {
  /** Instance unique identifier for trace purposes */
  private readonly uuid: string = v4();
  /** Registry used to store the metrics */
  private readonly registry: Registry | ClusterRegistry;
  /**
   * This is a cluster register used due to a failure in the prom-client library
   * https://github.com/siimon/prom-client/issues/501
   */
  private readonly clusterRegistryForWorkerMode?: ClusterRegistry;
  /**
   * Create a new instance of MetricsAggregator
   * @param registry - registry used to store the metrics
   * @param isWorker - flag to indicate if the instance is a worker
   */
  constructor(registry: Registry | ClusterRegistry, isWorker = false) {
    if (isWorker) {
      this.clusterRegistryForWorkerMode = new ClusterRegistry();
    }
    this.registry = registry;
    collectDefaultMetrics({
      register: this.registry,
    });
  }
  /** Return the metrics in text/plain format */
  public async metrics(): Promise<MetricsResponse> {
    const contentType = this.registry.contentType;
    let metrics: string | MetricValue<string>[];
    if (this.registry instanceof ClusterRegistry) {
      metrics = await this.registry.clusterMetrics();
    } else {
      metrics = await this.registry.metrics();
    }
    return {
      metrics,
      contentType,
    };
  }
  /** Return the actual metrics in JSON format */
  public async metricsJSON(): Promise<MetricsResponse> {
    const contentType = 'application/json';
    const metrics = await this.registry.getMetricsAsJSON();
    return Promise.resolve({
      metrics,
      contentType,
    });
  }
  /**
   * Configure several metrics in the aggregator an return an object with the metrics instances in
   * order to be able to use them in the application
   * @param metrics - Object with metrics configurations objects
   * @returns
   */
  public setMetrics<
    T extends Record<string, Metric> | void = void,
    K extends Record<string, MetricConfig> = Record<string, MetricConfig>
  >(metrics: K): MetricInstancesObject<T, K> {
    const result: Record<string, Metric> = {};
    try {
      for (const [name, config] of Object.entries(metrics)) {
        result[name] = this.setMetric(config);
      }
      return result as MetricInstancesObject<T, K>;
    } catch (rawError) {
      const error = Crash.from(rawError);
      throw new Crash(
        `Error including new metrics in the aggregator: ${error.message}`,
        this.uuid,
        { cause: error }
      );
    }
  }
  /**
   * Remove a metric from the registry
   * @param name - name of the metric
   */
  public removeMetric(name: string): void {
    this.registry.removeSingleMetric(name);
  }
  /**
   * Get a single metric from registry
   * @param name - name of metric
   */
  public getMetric(name: string): Metric | undefined {
    return this.registry.getSingleMetric(name);
  }
  /**
   * Get a single metric value in Prometheus format
   * @param name - name of metric
   */
  public getMetricAsString(name: string): Promise<string> {
    return this.registry.getSingleMetricAsString(name);
  }
  /**
   * Get a single metric value in JSON format
   * @param name - name of metric
   */
  public async getMetricAsJSON(
    name: string
  ): Promise<MetricObjectWithValues<MetricValue<string>> | undefined> {
    const metrics = (await this.metricsJSON()).metrics;
    if (Array.isArray(metrics)) {
      return metrics.find(entry => entry.name === name);
    } else {
      return undefined;
    }
  }
  /**
   * Cumulative metric that represents a single numerical value that only ever goes up
   * @param config - Configuration when creating a Counter metric. Name and Help is required.
   */
  private addCounter(config: Omit<CounterConfiguration<string>, 'registers'>): Counter {
    return new Counter({ ...config, registers: [this.registry] });
  }
  /**
   * Gauge is a metric that represents a single numerical value that can arbitrarily go up and down
   * @param config - Configuration when creating a Gauge metric. Name and Help is mandatory
   */
  private addGauge(config: Omit<GaugeConfiguration<string>, 'registers'>): Gauge {
    return new Gauge({ ...config, registers: [this.registry] });
  }
  /**
   * A histogram samples observations (usually things like request durations or response sizes) and
   * counts them in configurable buckets
   * @param config - Configuration when creating the Histogram. Name and Help is mandatory
   */
  private addHistogram(config: Omit<HistogramConfiguration<string>, 'registers'>): Histogram {
    return new Histogram({ ...config, registers: [this.registry] });
  }
  /**
   * A summary samples observations
   * @param config - Configuration when creating Summary metric. Name and Help is mandatory
   */
  private addSummary(config: Omit<SummaryConfiguration<string>, 'registers'>): Summary {
    return new Summary({ ...config, registers: [this.registry] });
  }
  /**
   *
   * @param config - Configuration for creating a metric. Name, help and type are mandatory
   * @returns
   */
  private setMetric<T extends MetricConfig>(config: T): Metric {
    let result: Metric | undefined;
    if (typeof config.name !== 'string' || config.name.length === 0) {
      throw new Crash('Metric name is required', this.uuid);
    }
    if (typeof config.help !== 'string' || config.help.length === 0) {
      throw new Crash('Metric help is required', this.uuid);
    }
    if (typeof config.type !== 'string' || !METRIC_TYPES.includes(config.type)) {
      throw new Crash(`Metric type is required, and should be one of: ${METRIC_TYPES}`, this.uuid);
    }
    switch (config.type) {
      case 'Counter':
        result = this.addCounter(config);
        break;
      case 'Gauge':
        result = this.addGauge(config);
        break;
      case 'Histogram':
        result = this.addHistogram(config);
        break;
      case 'Summary':
        result = this.addSummary(config);
        break;
      default:
        throw new Crash(`Unknown metric type ${config.type}`, this.uuid);
    }
    return result;
  }
}
