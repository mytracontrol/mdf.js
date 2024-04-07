/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Health, Layer } from '@mdf.js/core';
import { DebugLogger, LoggerInstance, SetContext } from '@mdf.js/logger';
import EventEmitter from 'events';
import express from 'express';
import {
  AggregatorRegistry,
  Metric,
  MetricObjectWithValues,
  MetricValue,
  PrometheusContentType,
  Registry,
} from 'prom-client';
import { Aggregator } from './Aggregator';
import { Router } from './Router';
import * as Metrics from './types';
import { METRICS_SERVICE_NAME, MetricsRegistryOptions } from './types';

/**
 * MetricsFacade class serves as a facade to simplify metrics management across all services
 * in an application. It leverages the prom-client library for metrics management and the express
 * library to expose these metrics via an HTTP endpoint.
 *
 * It accommodates working in cluster environments by optionally creating a new AggregatorRegistry
 * to hold metrics from all worker nodes, in addition to a separate registry for
 * application-specific metrics and the default prom-client registry. Thus, it can manage up to
 * three different registries:
 *
 * 1. Default prom-client registry for default metrics.
 * 2. Application-specific metrics registry.
 * 3. Cluster-wide metrics registry for environments running in a cluster.
 *
 * Depending on the environment and the node type (primary or worker), it responds to metric
 * requests by merging and presenting metrics from appropriate registries.
 */
export class MetricsFacade extends EventEmitter implements Layer.App.Service {
  /** Debug logger for development and deep troubleshooting */
  private readonly logger: LoggerInstance;
  /** Metrics aggregator */
  private readonly aggregator: Aggregator;
  /** Metrics aggregator registry */
  private readonly port: AggregatorRegistry<PrometheusContentType> | undefined;
  /** Metrics router */
  private readonly _router: Router;
  /**
   * Create an instance of metrics manager
   * @param options - Configuration options for the metrics manager
   */
  constructor(private readonly options: MetricsRegistryOptions) {
    super();
    this.logger = SetContext(
      // Stryker disable next-line all
      options.logger || new DebugLogger(`mdf:registry:metrics:${this.name}`),
      this.name,
      this.componentId
    );
    this.port = this.getPort(options.isCluster);
    this.aggregator = new Aggregator(this.logger, this.port);
    this._router = new Router(this.aggregator);
    // Stryker disable next-line all
    this.logger.debug(`Metrics manager created for ${this.name} application`);
  }
  /**
   * Conditionally creates an AggregatorRegistry if the service is running in a cluster.
   * @param isCluster - Boolean indicating if the service is running in cluster mode.
   * @returns An AggregatorRegistry instance or undefined if not in cluster mode.
   */
  private getPort(isCluster?: boolean): AggregatorRegistry<PrometheusContentType> | undefined {
    if (typeof isCluster === 'boolean') {
      return new AggregatorRegistry();
    } else {
      return undefined;
    }
  }
  /** @returns The application name */
  public get name(): string {
    return this.options.name;
  }
  /** @returns The application identifier */
  public get componentId(): string {
    return this.options.instanceId;
  }
  /** @returns An Express router with access to metrics information */
  public get router(): express.Router {
    return this._router.router;
  }
  /** @returns Links offered by this service */
  public get links(): { [link: string]: string } {
    return { [`${METRICS_SERVICE_NAME}`]: `/${METRICS_SERVICE_NAME}` };
  }
  /** @returns The health status of the component */
  public get status(): Health.Status {
    return Health.STATUS.PASS;
  }
  /** @returns Health checks for this service */
  public get checks(): Health.Checks {
    return {
      [`${this.name}:metrics`]: [
        {
          status: this.status,
          observedUnit: 'metrics',
          componentId: this.componentId,
          time: new Date().toISOString(),
        },
      ],
    };
  }
  /**
   * Registers one or multiple services to be monitored.
   * @param services - A single service or an array of services to be registered.
   */
  public register(services: Layer.App.Service | Layer.App.Service[]): void {
    this.aggregator.register(services);
    // Stryker disable next-line all
    this.logger.debug(`Service(s) registered in metrics aggregator`);
  }
  /** @returns The registry used by the aggregator */
  public get registry(): Registry {
    return this.aggregator.registry;
  }
  /** @returns Metrics in text/plain format */
  public async metricsText(): Promise<Metrics.Response> {
    return this.aggregator.metricsText();
  }
  /** @returns Metrics in JSON format */
  public async metricsJSON(): Promise<Metrics.Response> {
    return this.aggregator.metricsJSON();
  }
  /**
   * Retrieves a single metric by name.
   * @param name - The name of the metric.
   * @returns The metric or undefined if not found.
   */
  public getMetric(name: string): Metric | undefined {
    return this.aggregator.getMetric(name);
  }
  /**
   * Retrieves a single metric value in Prometheus format.
   * @param name - The name of the metric.
   * @returns A promise resolved with the metric value as a string.
   */
  public getMetricAsString(name: string): Promise<string> {
    return this.aggregator.getMetricAsString(name);
  }
  /**
   * Retrieves a single metric value in JSON format.
   * @param name - The name of the metric.
   * @returns A promise resolved with the metric object or undefined if not found.
   */
  public async getMetricAsJSON(
    name: string
  ): Promise<MetricObjectWithValues<MetricValue<string>> | undefined> {
    return this.aggregator.getMetricAsJSON(name);
  }
  /** Placeholder for starting the metrics service. */
  public async start(): Promise<void> {
    // Implementation might be added in future
    this.logger.debug('MetricsFacade start method called.');
  }
  /** Placeholder for stopping the metrics service. */
  public async stop(): Promise<void> {
    // Implementation might be added in future
    this.logger.debug('MetricsFacade stop method called.');
  }
  /** Clears all metrics from the registry. */
  public async close(): Promise<void> {
    this.aggregator.clear();
    // Stryker disable next-line all
    this.logger.debug('Metrics cleared from the registry');
  }
}
