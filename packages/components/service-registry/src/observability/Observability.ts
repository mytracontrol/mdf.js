/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health, Layer } from '@mdf.js/core';
import { Crash, Links, Multi } from '@mdf.js/crash';
import cluster from 'cluster';
import { ObservabilityAppManager } from './ObservabilityAppManager';
import { ErrorRecord, ErrorRegistry, HealthRegistry, Metrics, MetricsRegistry } from './registries';
import { ObservabilityOptions } from './types';

/**
 * Represents a comprehensive observability service that aggregates various registries
 * including health checks, metrics, and error logging. This class is responsible for
 * managing and initializing these registries, attaching services to them, and integrating
 * them into a unified observability application.
 *
 * The service leverages an `ObservabilityAppManager` to orchestrate the express application
 * that serves observability endpoints. It allows for dynamic registration of services
 * to enable monitoring, health checks, and error tracking.
 */
export class Observability {
  /** Manages the Express application dedicated to observability features. */
  private readonly _app: ObservabilityAppManager;
  /** Collection of registries (Health, Metrics, Errors) utilized by observability. */
  private readonly _registers: Layer.App.Service[];
  /** Central registry for capturing and reporting errors across services. */
  private readonly _errorsRegistry: ErrorRegistry;
  /** Central registry for collecting and exposing metrics from services. */
  private readonly _metricsRegistry: MetricsRegistry;
  /** Central registry for collecting and exposing metrics from services. */
  private readonly _healthRegistry: HealthRegistry;
  /**
   * Initializes the observability service with specified options, setting up
   * health, metrics, and error registries based on those options.
   * @param options - Configuration options for observability, including settings
   * for health checks, metrics collection, and error logging.
   */
  constructor(public readonly options: ObservabilityOptions) {
    this._healthRegistry = new HealthRegistry({
      applicationMetadata: this.options.metadata,
      isCluster: this.options.service?.isCluster,
      clusterUpdateInterval: this.options.service?.clusterUpdateInterval,
      logger: this.options.logger,
    });
    this._errorsRegistry = new ErrorRegistry({
      name: this.options.metadata.name,
      instanceId: this.options.metadata.instanceId,
      maxSize: this.options.service?.maxSize,
      includeStack: this.options.service?.includeStack,
      isCluster: this.options.service?.isCluster,
      clusterUpdateInterval: this.options.service?.clusterUpdateInterval,
      logger: options.logger,
    });
    this._metricsRegistry = new MetricsRegistry({
      name: this.options.metadata.name,
      instanceId: this.options.metadata.instanceId,
      isCluster: this.options.service?.isCluster,
      logger: this.options.logger,
    });
    this._registers = [this._healthRegistry, this._metricsRegistry, this._errorsRegistry];
    this._app = new ObservabilityAppManager(this.options, this._metricsRegistry.registry);
  }
  /**
   * Attaches a new service to be monitored under the observability framework.
   * Services are components of your application that you wish to monitor for
   * health, track errors for, and collect metrics on.
   * @param observable - The service to attach to observability.
   */
  public attach(observable: Layer.Observable): void {
    // Add the service that can emit errors to the errors registry
    this._errorsRegistry.register(observable);
    // Add the service that can collect metrics to the metrics registry
    this._metricsRegistry.register(observable as Layer.App.Service);
    // Add the service with health information to the health registry
    this._healthRegistry.register(observable as Layer.App.Service);
    // Add the service with REST API interface in the observability app
    this._app.register(observable as Layer.App.Service);
  }
  /** Start the observability service */
  public async start(): Promise<void> {
    if (this._app.isBuild) {
      return;
    }
    // If the service is running in a cluster or standalone, register the errors summary
    if (cluster.isPrimary) {
      this._healthRegistry.register(this._errorsRegistry);
    }
    // Register all the services in the observability app
    this._app.register(this._registers);

    // Start all the registers
    for (const register of this._registers) {
      await register.start();
    }
    this._app.build();
    await this._app.start();
  }
  /** Stop the observability service */
  public async stop(): Promise<void> {
    if (!this._app.isBuild) {
      return;
    }
    await this._app.stop();
    this._app.unbuilt();
    for (const register of this._registers) {
      await register.stop();
    }
  }
  /** Close the observability service */
  public async close(): Promise<void> {
    if (!this._app.isBuild) {
      return;
    }
    await this.stop();
    for (const register of this._registers) {
      if (typeof register.close === 'function') {
        await register.close();
      }
    }
  }
  /**
   * Adds an error to the registry, converting it to a structured format.
   * @param error - The error to register.
   */
  public push(error: Crash | Multi | Error): void {
    this._errorsRegistry.push(error);
  }
  /**
   * Adds a timestamped note to the health status.
   * @param note - Note to be added.
   */
  public addNote(note: string): void {
    this._healthRegistry.addNote(note);
  }
  /**
   * Update or add a check measure.
   * This should be used to inform about the state of resources behind the Component/Microservice,
   * for example states of connections with field devices.
   *
   * The new check will be taking into account in the overall health status.
   * The new check will be included in the `checks` object with the key "component:measure".
   * If this key already exists, the `componentId` of the `check` parameter will be checked, if
   * there is a check with the same `componentId` in the array, the check will be updated, in other
   * case the new check will be added to the existing array.
   *
   * The maximum number external checks is 100
   * @param component - component identification
   * @param measure - measure identification
   * @param check - check to be updated or included
   * @returns true, if the check has been updated
   */
  public addCheck(component: string, measure: string, check: Health.Check): boolean {
    return this._healthRegistry.addCheck(component, measure, check);
  }
  /** @returns The health of the monitored application */
  public get health(): Layer.App.Health {
    return this._healthRegistry.health;
  }
  /** @returns The status of the monitored application */
  public get status(): Health.Status {
    return this._healthRegistry.status;
  }
  /** @returns The metrics of the monitored application */
  public get metrics(): Promise<Metrics.Response> {
    return this._metricsRegistry.metricsJSON();
  }
  /** @returns The errors of the monitored application */
  public get errors(): ErrorRecord[] {
    return this._errorsRegistry.errors;
  }
  /** @returns The observability rest api access end points */
  public get links(): Links {
    return this._app.links;
  }
}

