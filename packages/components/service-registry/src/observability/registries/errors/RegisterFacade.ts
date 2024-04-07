/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health, Layer } from '@mdf.js/core';
import { DebugLogger, LoggerInstance, SetContext } from '@mdf.js/logger';
import cluster from 'cluster';
import EventEmitter from 'events';
import express from 'express';
import { Aggregator } from './Aggregator';
import { MasterPort, Port, WorkerPort } from './Ports';
import { Router } from './Router';
import { ErrorRecord, HandleableError, REGISTER_SERVICE_NAME, RegistryOptions } from './types';

/**
 * The RegisterFacade class provides a centralized solution for error monitoring across all
 * components of an application. It acts as a facade over various underlying mechanisms to
 * facilitate error aggregation, error information exposure through REST APIs, and error registry
 * management.
 *
 * It integrates with:
 * - Port: To handle inter-process communication for error information in clustered environments,
 *   distinguishing between master and worker processes.
 * - Aggregator: To aggregate error information from different components of the application.
 *
 * This class also provides a REST API endpoint for accessing collected error information and
 * supports operations for registering errors and clearing the error registry.
 */
export class RegisterFacade extends EventEmitter implements Layer.App.Service {
  /** Debug logger for development and deep troubleshooting */
  private readonly logger: LoggerInstance;
  /** Health aggregator */
  private readonly aggregator: Aggregator;
  /** Health registry */
  private readonly port?: Port;
  /** Health router */
  private readonly _router: Router;
  /**
   * Create an instance of register manager
   * @param options - registry options
   */
  constructor(private readonly options: RegistryOptions) {
    super();
    this.logger = SetContext(
      // Stryker disable next-line all
      options.logger || new DebugLogger(`mdf:registry:errors:${this.name}`),
      this.name,
      this.componentId
    );
    this.aggregator = new Aggregator(this.logger, this.options.maxSize, this.options.includeStack);
    this.port = this.getPort(options, this.aggregator, this.logger);
    this._router = new Router(this.aggregator);
    // Stryker disable next-line all
    this.logger.debug(`New error registry instance created`);
  }
  /**
   * Determines and initializes the appropriate Port instance based on the operating context
   * (master, worker, or standalone process) to manage error registry communication and updates.
   *
   * @param options - Registry and operational options.
   * @param aggregator - The aggregator instance for error collection.
   * @param logger - Logger instance for logging activities.
   * @returns An instance of Port or undefined if running in a standalone process.
   */
  private getPort(
    options: RegistryOptions,
    aggregator: Aggregator,
    logger: LoggerInstance
  ): Port | undefined {
    if (typeof options.isCluster === 'boolean') {
      return options.isCluster && cluster.isPrimary
        ? new MasterPort(aggregator, logger, options.clusterUpdateInterval)
        : new WorkerPort(aggregator, logger);
    }
    return undefined; // No port for standalone process
  }
  /** @returns The application name */
  public get name(): string {
    return this.options.name;
  }
  /** @returns The application identifier */
  public get componentId(): string {
    return this.options.instanceId;
  }
  /** @returns An Express router with access to registered errors */
  public get router(): express.Router {
    return this._router.router;
  }
  /** @returns Links offered by this service */
  public get links(): { [link: string]: string } {
    return { [`${REGISTER_SERVICE_NAME}`]: `/${REGISTER_SERVICE_NAME}` };
  }
  /** @returns The health status of the component */
  public get status(): Health.Status {
    return this.size > 0 ? Health.STATUS.WARN : Health.STATUS.PASS;
  }
  /** @returns Health checks for this service */
  public get checks(): Health.Checks {
    return {
      [`${this.name}:errors`]: [
        {
          componentId: this.componentId,
          processId: process.pid,
          componentType: 'system',
          observedValue: this.size,
          observedUnit: 'errors',
          status: this.status,
          time: this.lastUpdate,
        },
      ],
    };
  }
  /**
   * Registers one or multiple components to be monitored.
   * @param services - A single component or an array of component to be registered.
   */
  public register(component: Layer.Observable | Layer.Observable[]): void {
    this.aggregator.register(component);
  }
  /**
   * Adds an error to the registry, converting it to a structured format.
   * @param error - The error to register.
   */
  public push(error: HandleableError): void {
    this.aggregator.push(error);
  }
  /** Clear the error registry */
  public clear(): void {
    this.aggregator.clear();
    this.port?.clear();
  }
  /** @returns Returns a combined list of all the registered errors */
  public get errors(): ErrorRecord[] {
    return this.aggregator.errors;
  }
  /** @returns The current number of registered errors */
  public get size(): number {
    return this.aggregator.size;
  }
  /** @returns Last update date */
  public get lastUpdate(): string {
    return this.aggregator.lastUpdate;
  }
  /**
   * Starts the error registry service, including the communication port and error event listeners.
   */
  public async start(): Promise<void> {
    this.aggregator.on('error', this.errorEventHandler);
    this.port?.start();
    // Stryker disable next-line all
    this.logger.debug('Error registry service started');
  }
  /**
   * Stops the error registry service, including halting communication and removing event listeners.
   */
  public async stop(): Promise<void> {
    this.aggregator.off('error', this.errorEventHandler);
    this.port?.stop();
    // Stryker disable next-line all
    this.logger.debug('Error registry service stopped');
  }
  /** Closes the error registry service, performing cleanup actions as necessary. */
  public async close(): Promise<void> {
    this.aggregator.close();
    await this.stop();
    // Stryker disable next-line all
    this.logger.debug('Error registry service closed');
  }
  /**
   * Event handler for error event
   * @param error - Error triggered by the component
   */
  private readonly errorEventHandler = (error: ErrorRecord): void => {
    if (this.listenerCount('error') > 0) {
      this.emit('error', error);
    }
  };
}
