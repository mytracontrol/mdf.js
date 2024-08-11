/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health, Layer } from '@mdf.js/core';
import { DebugLogger, LoggerInstance, SetContext } from '@mdf.js/logger';
import cluster from 'cluster';
import { EventEmitter } from 'events';
import express from 'express';
import { Aggregator } from './Aggregator';
import { MasterPort, Port, WorkerPort } from './Ports';
import { Router } from './Router';
import { HEALTH_SERVICE_NAME, HealthRegistryOptions } from './types';

/**
 * The HealthFacade class serves as a comprehensive solution for monitoring and exposing the health
 * of all components within an application. It abstracts the complexity of health information
 * aggregation and distribution, making it accessible through a REST API and manageable across
 * different operational contexts (e.g., standalone, clustered master, and worker processes).
 *
 * This class leverages:
 * - Aggregator: To aggregate health checks and status events from components.
 * - Port: To handle health information requests and responses in a cluster, accommodating both
 *   master and worker roles.
 * - Router: To expose aggregated health information via a REST API.
 */
export class HealthFacade extends EventEmitter implements Layer.App.Service {
  /** Debug logger for development and deep troubleshooting */
  private readonly logger: LoggerInstance;
  /** Health aggregator */
  private readonly aggregator: Aggregator;
  /** Health registry */
  private readonly port?: Port;
  /** Health router */
  private readonly _router: Router;
  /**
   * Create an instance of health registry
   * @param options - health registry options
   */
  constructor(private readonly options: HealthRegistryOptions) {
    super();
    this.logger = SetContext(
      // Stryker disable next-line all
      this.options.logger || new DebugLogger(`mdf:registry:health:${this.name}`),
      HEALTH_SERVICE_NAME,
      this.options.applicationMetadata.instanceId
    );
    this.aggregator = new Aggregator(this.options.applicationMetadata, this.logger);
    this.port = this.getPort(this.options, this.aggregator, this.logger);
    this._router = new Router(this.aggregator);
    // Stryker disable next-line all
    this.logger.debug(`New health registry instance created`);
  }
  /**
   * Dynamically selects and initializes the appropriate Port implementation based on the
   * application's execution context (standalone, clustered master, or worker) to manage
   * health information exchange.
   * @param options - health registry options
   * @param aggregator - health aggregator
   * @param logger - logger instance
   * @returns Port to manage the health information
   */
  private getPort(
    options: HealthRegistryOptions,
    aggregator: Aggregator,
    logger: LoggerInstance
  ): Port | undefined {
    if (typeof options.isCluster === 'boolean') {
      return options.isCluster && cluster.isPrimary
        ? new MasterPort(aggregator, logger, options.clusterUpdateInterval)
        : new WorkerPort(aggregator, logger);
    }
    return undefined;
  }
  /** @returns The application name */
  public get name(): string {
    return this.options.applicationMetadata.name;
  }
  /** @returns The application identifier */
  public get componentId(): string {
    return this.options.applicationMetadata.instanceId;
  }
  /** @returns An Express router with access to health information */
  public get router(): express.Router {
    return this._router.router;
  }
  /** @returns Links offered by this service */
  public get links(): { [link: string]: string } {
    return { [`${HEALTH_SERVICE_NAME}`]: `/${HEALTH_SERVICE_NAME}` };
  }
  /** @returns The health status of the component */
  public get status(): Health.Status {
    return this.aggregator.status;
  }
  /** @returns Health checks for this service */
  public get checks(): Health.Checks {
    return this.aggregator.checks;
  }
  /**
   * Adds a timestamped note to the health status.
   * @param note - Note to be added.
   */
  public addNote(note: string): void {
    this.aggregator.addNote(note);
  }
  /**
   * Register a resource or a list of resources to monitor for errors.
   * @param component - Resource or list of resources to be registered
   */
  public register(component: Layer.App.Resource | Layer.App.Resource[]): void {
    this.aggregator.register(component);
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
    return this.aggregator.addExternalCheck(component, measure, check);
  }
  /** @returns The health of the application */
  public get health(): Layer.App.Health {
    return this.aggregator.health;
  }
  /** Start health service */
  public async start(): Promise<void> {
    // Stryker disable next-line all
    this.logger.debug('Starting health registry');
    this.port?.start();
    this.aggregator.on('status', this.statusEventHandler);
  }
  /** Stop health service */
  public async stop(): Promise<void> {
    // Stryker disable next-line all
    this.logger.debug('Stopping health registry');
    this.port?.stop();
    this.aggregator.off('status', this.statusEventHandler);
  }
  /** Close health service */
  public async close(): Promise<void> {
    // Stryker disable next-line all
    this.logger.debug('Closing health registry');
    await this.stop();
    this.aggregator.close();
  }
  /** Event handler for status event */
  private readonly statusEventHandler = (): void => {
    if (this.listenerCount('status') > 0) {
      this.emit('status', this.status);
    }
  };
}
