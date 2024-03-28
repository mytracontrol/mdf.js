/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health, Layer } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import cluster from 'cluster';
import { EventEmitter } from 'events';
import express from 'express';
import { Aggregator } from './Aggregator';
import { MasterRegistry, Registry, StandaloneRegistry, WorkerRegistry } from './Registries';
import { Router } from './Router';

const DEFAULT_CONFIG_MMS_CLUSTER_MODE = false;

export class HealthFacade extends EventEmitter implements Layer.Service.Observable {
  /** Health aggregator */
  private readonly aggregator: Aggregator;
  /** Health registry */
  private readonly registry: Registry;
  /** Health router */
  private readonly _router: Router;
  /**
   * Create an instance of health manager
   * @param metadata - application metadata
   * @param isCluster - indicates that the instance of this health service is running in a cluster
   * @param interval - interval to poll the workers, only used in cluster mode
   */
  public static create(
    metadata: Layer.App.Metadata,
    isCluster = DEFAULT_CONFIG_MMS_CLUSTER_MODE,
    interval?: number
  ): HealthFacade {
    const aggregator = new Aggregator();
    if (!isCluster) {
      return new HealthFacade(aggregator, new StandaloneRegistry(metadata, aggregator));
    } else if (cluster.isPrimary) {
      return new HealthFacade(aggregator, new MasterRegistry(metadata, aggregator, interval));
    } else {
      return new HealthFacade(aggregator, new WorkerRegistry(metadata, aggregator));
    }
  }
  /**
   * Create an instance of health manager
   * @param aggregator - Health aggregator
   * @param registry - Health registry
   */
  private constructor(aggregator: Aggregator, registry: Registry) {
    super();
    this.aggregator = aggregator;
    this.registry = registry;
    this._router = new Router(this.registry);
    this.aggregator.on('error', this.errorEventHandler);
  }
  /**
   * Register a new component to be monitored
   * @param component - component to be registered
   */
  public register(component: Health.Component): void;
  /**
   * Register several new components to be monitored
   * @param components - components to be registered
   */
  public register(components: Health.Component[]): void;
  public register(component: Health.Component | Health.Component[]): void {
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
    return this.aggregator.addCheck(component, measure, check);
  }
  /** Return an Express router with access to health information */
  public get router(): express.Router {
    return this._router.router;
  }
  /** Service name */
  public get name(): string {
    return 'health';
  }
  /** Return links offered by this service */
  public get links(): { [link: string]: string } {
    return { health: '/health' };
  }
  /** Overall component status */
  public get status(): Health.Status {
    return this.registry.status;
  }
  /** Overall component health */
  public get health(): Health.AppHealth {
    return this.registry.health();
  }
  /** Start to polling health diagnostic from workers */
  public async start(): Promise<void> {
    if (this.registry instanceof MasterRegistry) {
      this.registry.start();
    }
  }
  /** Stop polling health diagnostic from workers*/
  public async stop(): Promise<void> {
    if (this.registry instanceof MasterRegistry) {
      this.registry.stop();
    }
  }
  /**
   * Event handler for error event
   * @param error - Error triggered by the component
   * @param name - Component that triggered the error
   */
  private readonly errorEventHandler = (error: Crash | Error): void => {
    if (this.listenerCount('error') > 0) {
      this.emit('error', error);
    }
  };
}
