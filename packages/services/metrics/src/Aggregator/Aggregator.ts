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
import { Crash } from '@mdf.js/crash';
import {
  AggregatorRegistry as ClusterRegistry,
  collectDefaultMetrics,
  Counter,
  CounterConfiguration,
  Gauge,
  GaugeConfiguration,
  Histogram,
  HistogramConfiguration,
  metric,
  Metric,
  Registry,
  Summary,
  SummaryConfiguration,
} from 'prom-client';
import { v4 } from 'uuid';
import { MetricConfig, MetricInstancesObject, MetricsResponse, METRIC_TYPES } from '../types';

/** MetricsAggregator, management of all the metrics for this artifact */
export class Aggregator {
  /** Instance unique identifier for trace purposes */
  readonly #uuid: string = v4();
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
    let metrics: string | metric[];
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
    return Promise.resolve({
      metrics: await this.registry.getMetricsAsJSON(),
      contentType: 'application/json',
    });
  }
  /**
   * Configure several metrics in the aggregator an return an object with the metrics instances in
   * order to be able to use them in the application
   * @param metrics - Object with metrics configurations objects
   * @returns
   */
  public setMetrics<
    T extends Record<string, Metric<string>> | void = void,
    K extends Record<string, MetricConfig> = Record<string, MetricConfig>
  >(metrics: K): MetricInstancesObject<T, K> {
    const result: Record<string, Metric<string>> = {};
    try {
      for (const [name, config] of Object.entries(metrics)) {
        result[name] = this.setMetric(config);
      }
      return result as MetricInstancesObject<T, K>;
    } catch (rawError) {
      const error = Crash.from(rawError);
      throw new Crash(
        `Error including new metrics in the aggregator: ${error.message}`,
        this.#uuid,
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
  public getMetric(name: string): Metric<string> | undefined {
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
  public async getMetricAsJSON(name: string): Promise<metric | undefined> {
    const metrics = await (await this.metricsJSON()).metrics;
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
  private addCounter(config: Omit<CounterConfiguration<string>, 'registers'>): Counter<string> {
    return new Counter({ ...config, registers: [this.registry] });
  }
  /**
   * Gauge is a metric that represents a single numerical value that can arbitrarily go up and down
   * @param config - Configuration when creating a Gauge metric. Name and Help is mandatory
   */
  private addGauge(config: Omit<GaugeConfiguration<string>, 'registers'>): Gauge<string> {
    return new Gauge({ ...config, registers: [this.registry] });
  }
  /**
   * A histogram samples observations (usually things like request durations or response sizes) and
   * counts them in configurable buckets
   * @param config - Configuration when creating the Histogram. Name and Help is mandatory
   */
  private addHistogram(
    config: Omit<HistogramConfiguration<string>, 'registers'>
  ): Histogram<string> {
    return new Histogram({ ...config, registers: [this.registry] });
  }
  /**
   * A summary samples observations
   * @param config - Configuration when creating Summary metric. Name and Help is mandatory
   */
  private addSummary(config: Omit<SummaryConfiguration<string>, 'registers'>): Summary<string> {
    return new Summary({ ...config, registers: [this.registry] });
  }
  /**
   *
   * @param config - Configuration for creating a metric. Name, help and type are mandatory
   * @returns
   */
  private setMetric<T extends MetricConfig>(config: T): Metric<string> {
    let result: Metric<string> | undefined;
    if (typeof config.name !== 'string' || config.name.length === 0) {
      throw new Crash('Metric name is required', this.#uuid);
    }
    if (typeof config.help !== 'string' || config.help.length === 0) {
      throw new Crash('Metric help is required', this.#uuid);
    }
    if (typeof config.type !== 'string' || !METRIC_TYPES.includes(config.type)) {
      throw new Crash(`Metric type is required, and should be one of: ${METRIC_TYPES}`, this.#uuid);
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
        throw new Crash(`Unknown metric type ${config.type}`, this.#uuid);
    }
    return result;
  }
}
