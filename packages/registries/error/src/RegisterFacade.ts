/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Layer } from '@mdf.js/core';
import cluster from 'cluster';
import EventEmitter from 'events';
import express from 'express';
import { MasterRegistry, Registry, StandaloneRegistry, WorkerRegistry } from './Registries';
import { Router } from './Router';
import { ErrorRecord, HandleableError } from './types';

const DEFAULT_CONFIG_MMS_CLUSTER_MODE = false;

export class RegisterFacade extends EventEmitter implements Layer.Service.Observable {
  /** Errors registry */
  private readonly registry: Registry;
  /** Register router */
  private readonly _router: Router;
  /**
   * Create an instance of errors registries manager
   * @param maxSize - Maximum number of errors to be registered in this registry
   * @param isCluster - indicates that the instance of this error registry service is running in a
   * cluster
   * @param interval - interval to poll the workers, only used in cluster mode
   */
  public static create(
    maxSize?: number,
    isCluster = DEFAULT_CONFIG_MMS_CLUSTER_MODE,
    interval?: number
  ): RegisterFacade {
    if (!isCluster) {
      return new RegisterFacade(new StandaloneRegistry(maxSize));
    } else if (cluster.isPrimary) {
      return new RegisterFacade(new MasterRegistry(maxSize, interval));
    } else {
      return new RegisterFacade(new WorkerRegistry(maxSize));
    }
  }
  /**
   * Create an instance of register manager
   * @param registry - Errors registry
   */
  private constructor(registry: Registry) {
    super();
    this.registry = registry;
    this._router = new Router(registry);
  }
  /** Return an Express router with access to errors registry */
  public get router(): express.Router {
    return this._router.router;
  }
  /** Service name */
  public get name(): string {
    return 'register';
  }
  /** Return links offered by this service */
  public get links(): { [link: string]: string } {
    return { registers: '/registers' };
  }
  /**
   * Stored an error in the registry
   * @param error - Error to be stored
   */
  public push(error: HandleableError): void {
    this.registry.push(error);
  }
  /** Clear all the actual error in the registry */
  public clear(): void {
    this.registry.clear();
  }
  /** Get all the error in the registry */
  public get errors(): ErrorRecord[] {
    return this.registry.errors;
  }
  /** Get the number of error stored in the registry */
  public get size(): number {
    return this.registry.size;
  }
  /** Get last update date */
  public get lastUpdate(): string {
    return this.registry.lastUpdate;
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
}
