/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health, Layer } from '@mdf.js/core';
import { Crash, Multi } from '@mdf.js/crash';
import { DebugLogger, LoggerInstance, SetContext } from '@mdf.js/logger';
import EventEmitter from 'events';
import { Registry } from 'prom-client';
import { v4 } from 'uuid';
import { Validator } from '../Helpers';
import { Limiter, LimiterOptions } from '../Limiter';
import {
  DefaultPollingGroups,
  METRICS_DEFINITIONS,
  MetricsDefinitions,
  PollingExecutor,
  PollingGroup,
  TaskBaseConfig,
} from '../Polling';
import { DoneEventHandler, MetaData } from '../Tasks';
import { ResourceConfigEntry, ResourcesConfigObject, SchedulerOptions } from './types';

/** Represents the resource configuration */
type Resource = string;
/** Represents the polling period */
type PollingPeriod = string;

export declare interface Scheduler<Result = any> {
  /**
   * Add a listener for the `error` event, emitted when the component detects an error.
   * @param event - `error` event
   * @param listener - Error event listener
   * @event
   */
  on(event: 'error', listener: (error: Crash | Multi | Error) => void): this;
  /**
   * Add a listener for the status event, emitted when the component status changes.
   * @param event - `status` event
   * @param listener - Status event listener
   * @event
   */
  on(event: 'status', listener: (status: Health.Status) => void): this;
  /**
   * Add a listener for the `done` event, emitted when a task is done, with the result or the error.
   * @param event - `done` event
   * @param listener - Done event listener
   * @event
   */
  on(event: 'done', listener: DoneEventHandler<Result>): this;
  /**
   * Add a listener for the `done` event, emitted when a task is done, with the result or the error.
   * @param event - `done` event
   * @param listener - Done event listener
   * @event
   */
  addListener(event: 'done', listener: DoneEventHandler<Result>): this;
  /**
   * Add a listener for the `done` event, emitted when a task is done, with the result or the error.
   * This is a one-time event, the listener will be removed after the first emission.
   * @param event - `done` event
   * @param listener - Done event listener
   * @event
   */
  once(event: 'done', listener: DoneEventHandler<Result>): this;
  /**
   * Removes the specified listener from the listener array for the `done` event.
   * @param event - `done` event
   * @param listener - Error event listener
   * @event
   */
  off(event: 'done', listener: DoneEventHandler<Result>): this;
  /**
   * Removes the specified listener from the listener array for the `done` event.
   * @param event - `done` event
   * @param listener - Error event listener
   * @event
   */
  removeListener(event: 'done', listener: DoneEventHandler<Result>): this;
  /**
   * Removes all listeners, or those of the specified event.
   * @param event - `done` event
   */
  removeAllListeners(event?: 'done'): this;
}
/**
 * A scheduler is a service that manages the execution of tasks in a controlled and efficient way.
 * It is responsible for managing the resources and the rate limits of the tasks, and for emitting
 * events when the tasks are done or when an error occurs.
 * @template {any} Result - Task result type
 * @template {any} Binding - Task binding type
 * @template {PollingGroup} PollingGroups - Polling groups type
 */
export class Scheduler<
    Result = any,
    Binding = any,
    PollingGroups extends PollingGroup = DefaultPollingGroups,
  >
  extends EventEmitter
  implements Layer.App.Service
{
  /** Debug logger for development and deep troubleshooting */
  private readonly logger: LoggerInstance;
  /** Provider unique identifier for trace purposes */
  public readonly componentId: string = v4();
  /** Metrics registry */
  public readonly metrics: Registry = new Registry();
  /** Metrics definitions */
  readonly metricsDefinitions: MetricsDefinitions = METRICS_DEFINITIONS(this.metrics);
  /** Polling managers */
  private readonly pollingExecutors: Map<Resource, Map<PollingPeriod, PollingExecutor>> = new Map();
  /** Rate limiters for each resource */
  private readonly limiters: Map<Resource, Limiter> = new Map();
  /** Rate limiter */
  private readonly limiter: Limiter;
  /** Scheduler running status */
  private isRunning = false;
  /**
   * Create a new scheduler
   * @param name - The name of the scheduler
   * @param options - The options for the scheduler
   */
  constructor(
    public readonly name: string,
    private readonly options: SchedulerOptions<Result, Binding, PollingGroups> = {}
  ) {
    super();
    // Stryker disable next-line all
    this.logger = SetContext(
      options?.logger || new DebugLogger(`mdf:scheduler:${this.name}`),
      'Scheduler',
      this.componentId
    );
    this.limiter = new Limiter(options.limiterOptions);
    if (this.options.resources) {
      this.addResources(this.options.resources);
    }
  }
  /**
   * Event handler for error events
   * @param error - Error event
   */
  private onError = (error: Crash | Multi): void => {
    if (this.listenerCount('error') > 0) {
      this.emit('error', error);
    }
  };
  /**
   * Event handler for done events
   * @param uuid - Task UUID
   * @param result - Task result
   * @param meta - Task metadata
   * @param error - Task error
   */
  private onDone = (uuid: string, result: any, meta: MetaData, error?: Crash | Multi): void => {
    this.emit('done', uuid, result, meta, error);
  };
  /**
   * Get a map with the instances of the polling executor for a resource
   * @param resource - The resource
   * @returns The polling executor instances
   */
  private getResource(resource: Resource): Map<PollingPeriod, PollingExecutor> {
    let entry = this.pollingExecutors.get(resource);
    if (!entry) {
      entry = new Map();
      this.pollingExecutors.set(resource, entry);
    }
    return entry;
  }
  /**
   * Get the limiter for a resource, creating a new one if it does not exist. The limiter is
   * piped to the main limiter of the scheduler if it is created.
   * @param resource - The resource
   * @param options - The limiter options
   * @returns The limiter instance
   */
  private getLimiter(resource: Resource, options: LimiterOptions): Limiter {
    const limiter = this.limiters.get(resource);
    if (limiter) {
      return limiter;
    }
    const newLimiter = new Limiter(options);
    this.limiters.set(resource, newLimiter);
    newLimiter.pipe(this.limiter);
    return newLimiter;
  }
  /**
   * Add a resource to the scheduler
   * @param resource - The resource
   * @param entry - The resource configuration
   */
  public addResource(
    resource: string,
    entry: ResourceConfigEntry<Result, Binding, PollingGroups>
  ): void {
    return this.addResources({ [resource]: entry });
  }
  /**
   * Add resources to the scheduler
   * @param resources - The resources configuration
   */
  public addResources(resources: ResourcesConfigObject<Result, Binding, PollingGroups>): void {
    if (this.isRunning) {
      throw new Crash(`Cannot add resources to a running scheduler`, this.componentId);
    }
    Validator.validateResources(resources);
    for (const [resource, entry] of Object.entries(resources)) {
      const resourceEntry = this.getResource(resource);
      const limiter = this.getLimiter(resource, entry.limiterOptions || {});
      for (const [period, tasks] of Object.entries(entry.pollingGroups)) {
        const manager = new PollingExecutor(
          {
            componentId: this.componentId,
            resource,
            pollingGroup: period as PollingGroup,
            entries: tasks as TaskBaseConfig<Result, Binding>[],
            logger: this.logger,
          },
          limiter,
          this.metricsDefinitions
        );
        resourceEntry.set(period, manager);
      }
    }
  }
  /**
   * Drop a resource from the scheduler
   * @param resource - The resource to drop
   */
  public dropResource(resource: string): void {
    if (this.isRunning) {
      throw new Crash(`Cannot drop resources from a running scheduler`, this.componentId);
    }
    const resourceEntry = this.pollingExecutors.get(resource);
    if (!resourceEntry) {
      return;
    }
    for (const manager of resourceEntry.values()) {
      manager.stop();
      manager.removeAllListeners();
    }
    this.pollingExecutors.delete(resource);
    const limiter = this.limiters.get(resource);
    if (limiter) {
      limiter.stop();
      limiter.removeAllListeners();
      this.limiters.delete(resource);
    }
  }
  /** Cleanup the scheduler */
  public cleanup(): void {
    if (this.isRunning) {
      throw new Crash(`Cannot cleanup a running scheduler`, this.componentId);
    }
    this.pollingExecutors.clear();
  }
  /** Start the scheduler */
  public async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }
    this.limiter.start();
    for (const resource of this.pollingExecutors.values()) {
      for (const manager of resource.values()) {
        manager.start();
        manager.on('error', this.onError);
        manager.on('done', this.onDone);
      }
    }
    this.isRunning = true;
    this.logger.info('Scheduler started');
  }
  /** Stop the scheduler */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    for (const resource of this.pollingExecutors.values()) {
      for (const manager of resource.values()) {
        await manager.stop();
        manager.off('error', this.onError);
        manager.off('done', this.onDone);
      }
    }
    this.limiter.stop();
    this.limiter.clear();
    this.isRunning = false;
    this.logger.info('Scheduler stopped');
  }
  /** Close the scheduler */
  public async close(): Promise<void> {
    this.logger.info('Closing scheduler');
    await this.stop();
    this.removeAllListeners();
  }
  /** Get the health status for the scheduler */
  public get status(): Health.Status {
    return Health.overallStatus(this.checks);
  }
  /** Get the health checks for the scheduler */
  public get checks(): Health.Checks {
    const checks: Health.Checks = {
      'scheduler:status': [],
    };
    for (const resource of this.pollingExecutors.values()) {
      for (const manager of resource.values()) {
        checks['scheduler:status'].push(manager.check);
      }
    }
    return checks;
  }
}
