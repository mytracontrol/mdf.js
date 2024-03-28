/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health, Layer, Metrics } from '@mdf.js/core';
import { Crash, Multi } from '@mdf.js/crash';
import { DebugLogger, LoggerInstance, SetContext } from '@mdf.js/logger';
import EventEmitter from 'events';
import { v4 } from 'uuid';
import { Validator } from '../Helpers';
import { Limiter } from '../Limiter';
import {
  DefaultPollingGroups,
  METRICS_DEFINITIONS,
  MetricsDefinitions,
  PollingExecutor,
  PollingGroup,
  TaskBaseConfig,
} from '../Polling';
import { MetaData } from '../Tasks';
import { SchedulerOptions } from './types';

export declare interface Scheduler<Result = any> {
  /** Emitted on every error */
  on(event: 'error', listener: (error: Error | Crash) => void): this;
  /** Emitted on every state change */
  on(event: 'status', listener: (status: Health.Status) => void): this;
  /** Emitted when a task has ended */
  on(
    event: 'done',
    listener: (uuid: string, result: Result, meta: MetaData, error?: Crash | Multi) => void
  ): this;
}

export class Scheduler<
    Result = any,
    Binding = any,
    PollingGroups extends PollingGroup = DefaultPollingGroups,
  >
  extends EventEmitter
  implements Layer.App.Resource
{
  /** Debug logger for development and deep troubleshooting */
  private readonly logger: LoggerInstance;
  /** Provider unique identifier for trace purposes */
  readonly componentId: string = v4();
  /** Polling managers */
  private readonly managers: PollingExecutor[] = [];
  /** Rate limiter */
  private readonly limiter: Limiter;
  /**
   * Create a new scheduler
   * @param name - The name of the scheduler
   * @param options - The options for the scheduler
   */
  constructor(
    public readonly name: string,
    private readonly options: SchedulerOptions<Result, Binding, PollingGroups>
  ) {
    super();
    // Stryker disable next-line all
    this.logger = SetContext(
      options?.logger || new DebugLogger(`mdf:scheduler:${this.name}`),
      'Scheduler',
      this.componentId
    );
    Validator.validateResources(options.resources);
    this.limiter = new Limiter(options.limiterOptions);
    for (const [resource, entry] of Object.entries(this.options.resources)) {
      const limiter = new Limiter(entry.limiterOptions);
      limiter.pipe(this.limiter);
      for (const [period, tasks] of Object.entries(entry.pollingGroups)) {
        const manager = new PollingExecutor(
          {
            componentId: this.componentId,
            resource,
            pollingGroup: period as PollingGroup,
            entries: tasks as TaskBaseConfig<Result, Binding>[],
            logger: this.logger,
          },
          limiter
        );
        this.managers.push(manager);
      }
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
  /** Set the metrics registry for the firehose */
  public setMetricRegistry(registry: Metrics.Registry): void {
    const metrics = registry.setMetrics(METRICS_DEFINITIONS(this.name)) as MetricsDefinitions;
    for (const manager of this.managers) {
      manager.setMetrics(metrics);
    }
  }
  /** Start the scheduler */
  public async start(): Promise<void> {
    this.limiter.start();
    for (const manager of this.managers) {
      manager.start();
      manager.on('error', this.onError);
      manager.on('done', this.onDone);
    }
    this.logger.info('Scheduler started');
  }
  /** Stop the scheduler */
  public async stop(): Promise<void> {
    for (const manager of this.managers) {
      await manager.stop();
      manager.off('error', this.onError);
      manager.off('done', this.onDone);
    }
    this.limiter.stop();
    this.limiter.clear();
    this.logger.info('Scheduler stopped');
  }
  /** Close the scheduler */
  public async close(): Promise<void> {
    this.logger.info('Closing scheduler');
    await this.stop();
    this.removeAllListeners();
  }
  /** Get the health checks for the scheduler */
  public get checks(): Health.Checks {
    const checks: Health.Checks = {
      'scheduler:status': [],
    };
    for (const manager of this.managers) {
      checks['scheduler:status'].push(manager.check);
    }
    return checks;
  }
}
