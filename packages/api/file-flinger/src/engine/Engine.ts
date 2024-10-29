/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health, type Layer } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { DebugLogger, SetContext, type LoggerInstance } from '@mdf.js/logger';
import { DoneListener, Limiter, Sequence } from '@mdf.js/tasks';
import EventEmitter from 'events';
import { merge } from 'lodash';
import type { Registry } from 'prom-client';
import { v4 } from 'uuid';
import type { Keygen } from '../keygen';
import { MetricsHandler } from '../metrics';
import { PusherWrapper, type Pusher } from '../pusher';
import { FileTasks } from './FileTasks';
import { DEFAULT_ENGINE_OPTIONS, DEFAULT_LIMITER_OPTIONS, type EngineOptions } from './types';

export class Engine extends EventEmitter implements Layer.App.Resource {
  /** Engine options */
  private readonly options: EngineOptions;
  /** Pusher streams */
  private readonly pushers: Pusher[];
  /** Debug logger for development and deep troubleshooting */
  private readonly logger: LoggerInstance;
  /** Metrics handler */
  private readonly metricsHandler: MetricsHandler;
  /** The limiter instance to manage concurrency*/
  private readonly limiter: Limiter;
  /** File tasks */
  private readonly fileTasks: FileTasks;
  /** Pending processes */
  private readonly pendingProcess: Map<string, Sequence<any, FileTasks>> = new Map();
  /**
   * Create a new watcher instance with the given options
   * @param keygen - The key generator to use
   * @param options - The watcher options
   * @param logger - The logger instance
   */
  constructor(
    private readonly keygen: Keygen,
    options: EngineOptions,
    logger?: LoggerInstance
  ) {
    super();
    this.options = merge({}, DEFAULT_ENGINE_OPTIONS, options);
    // Stryker disable next-line all
    this.logger = SetContext(logger || new DebugLogger(`mdf:fileFlinger:engine`), 'engine', v4());

    this.pushers = this.options.pushers.map(pusher => {
      return new PusherWrapper(pusher);
    });
    this.limiter = new Limiter({
      ...DEFAULT_LIMITER_OPTIONS,
      retryOptions: this.options.retryOptions ?? DEFAULT_LIMITER_OPTIONS.retryOptions,
    });
    this.metricsHandler = new MetricsHandler(this.limiter);
    this.fileTasks = new FileTasks(this.options, this.logger);
  }
  /** Pusher event handlers */
  private readonly onErrorEventHandler = (error: Error | Crash) => {
    // Stryker disable next-line all
    this.logger.error(`${error.message}`);
    if (this.listenerCount('error') > 0) {
      this.emit('error', error);
    }
  };
  /** Limiter done event handler */
  private readonly onDoneEventHandler: DoneListener = (uuid, result, meta, error) => {
    this.logger.debug(`File processed: ${JSON.stringify(meta, null, 2)}`);
    if (!error) {
      this.logger.info(`Task [${uuid}] of type [${meta.taskId}] was completed successfully`);
      if (this.pendingProcess.has(meta.taskId)) {
        this.pendingProcess.delete(meta.taskId);
      }
    } else {
      this.logger.error(
        `Task [${uuid}] of type [${meta.taskId}] failed with error: ${error.message}`
      );
      const task = this.pendingProcess.get(meta.taskId);
      if (task) {
        this.logger.debug(`Retrying task [${uuid}] of type [${meta.taskId}] ...`);
        setTimeout(
          this.limiter.schedule.bind(this.limiter),
          this.options.failedOperationDelay,
          task
        );
      } else {
        // Stryker disable next-line all
        this.logger.error(
          `Task [${uuid}] of type [${meta.taskId}] not found in the pending process`
        );
      }
      this.onErrorEventHandler(error);
    }
  };
  /** Perform the subscription to the events from pushers and limiter */
  private wrappingEvents(): void {
    for (const pusher of this.pushers) {
      pusher.on('error', this.onErrorEventHandler);
    }
    this.limiter.on('done', this.onDoneEventHandler);
  }
  /** Perform the unsubscription to the events from pushers and limiter */
  private unwrappingEvents(): void {
    for (const pusher of this.pushers) {
      pusher.off('error', this.onErrorEventHandler);
    }
    this.limiter.off('done', this.onDoneEventHandler);
  }
  /** Get the health of the file tasks handler */
  private get fileTasksHealth(): Health.Checks {
    const status = this.fileTasks.erroredFiles.size > 0 ? Health.STATUS.FAIL : Health.STATUS.PASS;
    return {
      [`${this.name}:fileTasks`]: [
        {
          status,
          componentId: this.componentId,
          componentType: 'fileTasks',
          observedValue: Array.from(this.fileTasks.erroredFiles.values()),
          observedUnit: 'errored files',
          time: new Date().toISOString(),
          output: status === Health.STATUS.FAIL ? 'Some files failed to be processed' : undefined,
        },
      ],
    };
  }
  /** Add a file to the be processed */
  public async processFile(filePath: string): Promise<void> {
    let key: string;
    try {
      key = await this.keygen.generateKey(filePath);
      if (this.pendingProcess.has(key)) {
        this.logger.warn(`File [${filePath}] already in process, skipping ...`);
        return;
      }
    } catch (rawError) {
      this.limiter.schedule(this.fileTasks.getProcessErroredFileTask(filePath, rawError));
      this.onErrorEventHandler(Crash.from(rawError, this.componentId));
      return;
    }
    const task = this.fileTasks.getProcessFileTask(filePath, key);
    this.pendingProcess.set(key, task);
    this.limiter.schedule(task);
    this.logger.info(`Task for [${key}] was scheduled`);
  }
  /** Start the file flinger */
  public async start(): Promise<void> {
    this.wrappingEvents();
    const startedPushers = [];
    try {
      for (const pusher of this.pushers) {
        // Stryker disable next-line all
        this.logger.info(`Starting pusher ${pusher.name} ...`);
        await pusher.start();
        // Stryker disable next-line all
        this.logger.info(`... pusher ${pusher.name} started`);
        startedPushers.push(pusher);
      }
      this.limiter.start();
    } catch (rawError) {
      const error = Crash.from(rawError, this.componentId);
      // Stryker disable next-line all
      this.logger.error(`Error starting the file flinger: ${error.message}`);
      // Stryker disable next-line all
      this.logger.warn(`Stopping all the already started pushers ...`);
      for (const pusher of startedPushers) {
        // Stryker disable next-line all
        this.logger.info(`Stopping pusher ${pusher.name} ...`);
        await pusher.stop();
        // Stryker disable next-line all
        this.logger.info(`... pusher ${pusher.name} stopped`);
      }
      throw error;
    }
  }
  /** Stop the file flinger */
  public async stop(): Promise<void> {
    this.unwrappingEvents();
    this.limiter.stop();
    for (const pusher of this.pushers) {
      // Stryker disable next-line all
      this.logger.info(`Stopping pusher ${pusher.name} ...`);
      await pusher.stop();
      // Stryker disable next-line all
      this.logger.info(`... pusher ${pusher.name} stopped`);
    }
  }
  /** Close the file flinger */
  public async close(): Promise<void> {
    await this.stop();
    for (const pusher of this.pushers) {
      // Stryker disable next-line all
      this.logger.info(`Closing pusher ${pusher.name} ...`);
      await pusher.close();
      // Stryker disable next-line all
      this.logger.info(`... pusher ${pusher.name} closed`);
    }
    this.metricsHandler.registry.clear();
    this.limiter.clear();
  }
  /** Get the name of the watcher */
  public get name(): string {
    return this.options.name;
  }
  /** Get the component identifier */
  public get componentId(): string {
    return this.options.componentId;
  }
  /** Overall component status */
  public get status(): Health.Status {
    return Health.overallStatus(this.checks);
  }
  /**
   * Return the status of the firehose in a standard format
   * @returns _check object_ as defined in the draft standard
   * https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check-05
   */
  public get checks(): Health.Checks {
    let overallChecks: Health.Checks = {};
    for (const pusher of this.pushers) {
      overallChecks = { ...pusher.checks, ...overallChecks };
    }
    return { ...overallChecks, ...this.fileTasksHealth };
  }
  /** Return the metrics registry */
  public get metrics(): Registry {
    return this.metricsHandler.registry;
  }
}
