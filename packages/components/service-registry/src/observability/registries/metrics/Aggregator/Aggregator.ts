/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Layer } from '@mdf.js/core';
import { LoggerInstance } from '@mdf.js/logger';
import cluster from 'cluster';
import {
  AggregatorRegistry,
  Metric,
  MetricObjectWithValues,
  MetricValue,
  PrometheusContentType,
  Registry,
  collectDefaultMetrics,
  register,
} from 'prom-client';
import * as Metrics from '../types';

/**
 * MetricsAggregator class manages all the metrics for this artifact,
 * integrating with Prometheus for metrics collection and aggregation.
 */
export class Aggregator {
  /** Default prom-client registry for collecting default metrics */
  private readonly defaultRegistry = register;
  /** Registry for storing custom metrics */
  private _registry: Registry;
  /** Map to keep track of registered services */
  private readonly components: Map<string, Layer.App.Service> = new Map();
  /**
   * Create a new instance of MetricsAggregator
   * @param logger - Instance for logging
   * @param port - Optional AggregatorRegistry for cluster metrics
   */
  constructor(
    private readonly logger: LoggerInstance,
    private readonly port?: AggregatorRegistry<PrometheusContentType>
  ) {
    // Collect default metrics and label them with the instance identifier
    this.collectDefaultMetrics(this.defaultRegistry);
    this._registry = new Registry();
    if (this.port !== undefined && !cluster.isPrimary) {
      // Stryker disable next-line all
      this.logger.debug(
        `The metrics aggregator is running in a worker node, we will collect the metrics from the application and the default prom-client registry`
      );
      AggregatorRegistry.setRegistries([this._registry, this.defaultRegistry]);
    }
    // Stryker disable next-line all
    this.logger.debug(`New metric aggregator instance created: ${this._registry.contentType}`);
  }
  /**
   * Add default metrics to the registry if they are not already present
   * @param register - Registry to add the default metrics
   */
  private collectDefaultMetrics(register: Registry): void {
    if (!register.getSingleMetric('process_cpu_user_seconds_total')) {
      collectDefaultMetrics({
        register,
        labels: {
          NODE_APP_INSTANCE:
            process.env['NODE_APP_INSTANCE'] ?? !cluster.isPrimary
              ? `worker${cluster.worker?.id}`
              : `primary`,
        },
      });
    }
  }
  /**
   * Register a service or a list of services in the aggregator
   * @param service - Service to register in the aggregator
   */
  public register(service: Layer.App.Service | Layer.App.Service[]): void {
    const _services = Array.isArray(service) ? service : [service];
    for (const entry of _services) {
      if (!this.components.has(entry.name)) {
        if ('metrics' in entry && entry.metrics instanceof Registry) {
          // Stryker disable next-line all
          this.logger.debug(`Registering metrics for service: ${entry.name}`);
          this._registry = Registry.merge([this._registry, entry.metrics]);
          this.components.set(entry.name, entry);
        } else {
          // Stryker disable next-line all
          this.logger.debug(`Service ${entry.name} does not have metrics to register`);
        }
      } else {
        // Stryker disable next-line all
        this.logger.warn(`Service ${entry.name} is already registered`);
      }
    }
  }
  /** Return the registry used by the aggregator */
  public get registry(): Registry {
    return this._registry;
  }
  /** Return the metrics in text/plain format */
  public async metricsText(): Promise<Metrics.Response> {
    let metrics = await this._registry.metrics();
    metrics += await this.defaultRegistry.metrics();
    if (this.port && cluster.isPrimary) {
      metrics += await this.port.clusterMetrics();
    }
    return {
      metrics,
      contentType: this._registry.contentType,
    };
  }
  /** Return the actual metrics in JSON format */
  public async metricsJSON(): Promise<Metrics.Response> {
    const contentType = 'application/json';
    const metrics = [
      ...(await this._registry.getMetricsAsJSON()),
      ...(await this.defaultRegistry.getMetricsAsJSON()),
    ];
    return {
      metrics,
      contentType,
    };
  }
  /**
   * Retrieves a single metric by name from the registry.
   * @param name - The name of the metric to retrieve
   */
  public getMetric(name: string): Metric | undefined {
    return this._registry.getSingleMetric(name);
  }
  /**
   * Retrieves a single metric value in Prometheus format by name.
   * @param name - The name of the metric to retrieve
   */
  public async getMetricAsString(name: string): Promise<string> {
    return this._registry.getSingleMetricAsString(name);
  }
  /**
   * Retrieves a single metric value in JSON format by name.
   * @param name - The name of the metric to retrieve
   */
  public async getMetricAsJSON(
    name: string
  ): Promise<MetricObjectWithValues<MetricValue<string>> | undefined> {
    const metrics = [
      ...(await this._registry.getMetricsAsJSON()),
      ...(await this.defaultRegistry.getMetricsAsJSON()),
    ];
    return metrics.find(entry => entry.name === name);
  }
  /** Clear the registry */
  public clear(): void {
    this.logger.debug('Clearing all metrics from the registry.');
    this._registry.clear();
    this.defaultRegistry.clear();
    if (this.port) {
      this.port.clear();
    }
  }
}
