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

import { Health } from '@mdf.js/core';
import { coerce } from '@mdf.js/utils';
import cluster from 'cluster';
import EventEmitter from 'events';
import express from 'express';
import {
  AggregatorRegistry as ClusterRegistry,
  metric,
  Metric,
  register as WorkerRegistry,
  Registry as StandAloneRegistry,
} from 'prom-client';
import { Aggregator } from './Aggregator';
import { Router } from './Router';
import { MetricConfig, MetricInstancesObject, MetricsResponse } from './types';

const DEFAULT_CONFIG_MMS_CLUSTER_MODE = false;

export const CONFIG_MMS_CLUSTER_MODE = coerce(
  process.env['CONFIG_MMS_CLUSTER_MODE'],
  DEFAULT_CONFIG_MMS_CLUSTER_MODE
);

export class MetricsFacade extends EventEmitter implements Health.Service {
  /** Metrics aggregator */
  private readonly aggregator: Aggregator;
  /** Metrics router */
  private readonly _router: Router;
  /**
   * Create an instance of metrics manager
   * @param isCluster - indicates that the instance of this metrics service is running in a cluster
   */
  public static create(isCluster = CONFIG_MMS_CLUSTER_MODE): MetricsFacade {
    if (!isCluster) {
      const aggregator = new Aggregator(new StandAloneRegistry());
      return new MetricsFacade(aggregator, new Router(aggregator, isCluster));
    } else if (cluster.isPrimary) {
      const aggregator = new Aggregator(new ClusterRegistry());
      return new MetricsFacade(aggregator, new Router(aggregator, isCluster));
    } else {
      const aggregator = new Aggregator(WorkerRegistry, true);
      return new MetricsFacade(aggregator, new Router(aggregator, isCluster));
    }
  }
  /**
   * Create an instance of metrics manager
   * @param aggregator - Metrics aggregator
   * @param router - Metrics router
   */
  private constructor(aggregator: Aggregator, router: Router) {
    super();
    this.aggregator = aggregator;
    this._router = router;
  }
  /** Return an Express router with access to metrics information */
  public get router(): express.Router {
    return this._router.router;
  }
  /** Service name */
  public get name(): string {
    return 'metrics';
  }
  /** Return links offered by this service */
  public get links(): { [link: string]: string } {
    return { metrics: '/metrics' };
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
    return this.aggregator.setMetrics(metrics);
  }
  /** Return the metrics in text/plain format */
  public async metrics(): Promise<MetricsResponse> {
    return this.aggregator.metrics();
  }
  /** Return the actual metrics in JSON format */
  public async metricsJSON(): Promise<MetricsResponse> {
    return this.aggregator.metricsJSON();
  }
  /**
   * Remove a metric from the registry
   * @param name - name of the metric
   */
  public removeMetric(name: string): void {
    this.aggregator.removeMetric(name);
  }
  /** Get a single metric from registry
   * @param name - name of metric
   */
  public getMetric(name: string): Metric<string> | undefined {
    return this.aggregator.getMetric(name);
  }
  /** Get a single metric value in Prometheus format
   * @param name - name of metric
   */
  public getMetricAsString(name: string): Promise<string> {
    return this.aggregator.getMetricAsString(name);
  }
  /** Get a single metric value in JSON format
   * @param name - name of metric
   */
  public async getMetricAsJSON(name: string): Promise<metric | undefined> {
    return this.aggregator.getMetricAsJSON(name);
  }
  /** Start service function */
  public async start(): Promise<void> {
    return;
  }
  /** Stop service function */
  public async stop(): Promise<void> {
    return;
  }
}
