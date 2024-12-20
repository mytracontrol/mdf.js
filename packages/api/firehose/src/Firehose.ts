/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health, Jobs, Layer } from '@mdf.js/core';
import { Crash, Multi } from '@mdf.js/crash';
import { DebugLogger, LoggerInstance, SetContext } from '@mdf.js/logger';
import EventEmitter from 'events';
import { Registry } from 'prom-client';
import { Writable } from 'stream';
import { v4 } from 'uuid';
import { Engine } from './Engine';
import { Helpers } from './helpers';
import { MetricsHandler } from './metrics';
import { FirehoseOptions, JobEventHandler, Sinks, Sources } from './types';

export declare interface Firehose<
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, any> = Jobs.NoMoreHeaders,
  CustomOptions extends Record<string, any> = Jobs.NoMoreOptions,
> {
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
   * Register an event listener over the `job` event, which is emitted when a new job is received
   * from a source.
   * @param event - `job` event
   * @param listener - Job event listener
   * @event
   */
  on(event: 'job', listener: JobEventHandler<Type, Data, CustomHeaders, CustomOptions>): this;
  /**
   * Register an event listener over the `done` event, which is emitted when a job has ended, either
   * due to completion or failure.
   * @param event - `done` event
   * @param listener - Done event listener
   * @event
   */
  on(event: 'done', listener: Jobs.DoneEventHandler<Type>): this;
  /**
   * Register an event listener over the `hold` event, which is emitted when the engine is paused due
   * to inactivity.
   * @param event - `restart` event
   * @param listener - Hold event listener
   * @event
   */
  on(event: 'hold', listener: () => void): this;
  /**
   * Register an event listener over the `done` event, which is emitted when a job has ended, either
   * due to completion or failure.
   * @param event - `done` event
   * @param listener - Done event listener
   * @event
   */
  addListener(event: 'done', listener: Jobs.DoneEventHandler<Type>): this;
  /**
   * Registers a event listener over the `done` event, at the beginning of the listeners array,
   * which is emitted when a job has ended, either due to completion or failure.
   * @param event - `done` event
   * @param listener - Done event listener
   * @event
   */
  prependListener(event: 'done', listener: Jobs.DoneEventHandler<Type>): this;
  /**
   * Registers a one-time event listener over the `done` event, which is emitted when a job has
   * ended, either due to completion or failure.
   * @param event - `done` event
   * @param listener - Done event listener
   * @event
   */
  once(event: 'done', listener: Jobs.DoneEventHandler<Type>): this;
  /**
   * Registers a one-time event listener over the `done` event, at the beginning of the listeners
   * array, which is emitted when a job has ended, either due to completion or failure.
   * @param event - `done` event
   * @param listener - Done event listener
   * @event
   */
  prependOnceListener(event: 'done', listener: Jobs.DoneEventHandler<Type>): this;
  /**
   * Removes the specified listener from the listener array for the `done` event.
   * @param event - `done` event
   * @param listener - The listener function to remove
   * @event
   */
  removeListener(event: 'done', listener: Jobs.DoneEventHandler<Type>): this;
  /**
   * Removes the specified listener from the listener array for the `done` event.
   * @param event - `done` event
   * @param listener - The listener function to remove
   * @event
   */
  off(event: 'done', listener: Jobs.DoneEventHandler<Type>): this;
  /**
   * Removes all listeners, or those of the specified event.
   * @param event - `done` event
   * @event
   */
  removeAllListeners(event?: 'done'): this;
}

/**
 * Firehose class
 * Allows to create a firehose(DTL pipeline) instance to manage the flow of jobs between sources and
 * sinks. Sinks are the final destination of the jobs, sources are the origin of the jobs and the
 * engine is the processing unit that manages the flow of jobs between sources and sinks applying
 * strategies to the jobs.
 * @typeParam Type - Job type, used as selector for strategies in job processors
 * @typeParam Data - Job payload
 * @typeParam CustomHeaders - Custom headers, used to pass specific information for job processors
 * @typeParam CustomOptions - Custom options, used to pass specific information for job processors
 */
export class Firehose<
    Type extends string = string,
    Data = any,
    CustomHeaders extends Record<string, any> = Jobs.NoMoreHeaders,
    CustomOptions extends Record<string, any> = Jobs.NoMoreOptions,
  >
  extends EventEmitter
  implements Layer.App.Service
{
  /** Debug logger for development and deep troubleshooting */
  private readonly logger: LoggerInstance;
  /** Provider unique identifier for trace purposes */
  readonly componentId: string = v4();
  /** Engine stream */
  private engine: Engine;
  /** Sink streams */
  private sinks: Sinks[];
  /** Source streams */
  private sources: Sources[];
  /** Metrics handler */
  private metricsHandler: MetricsHandler;
  /** Flag to indicate that an stop request has been received */
  private stopping: boolean;
  /**
   * Create a new instance for a firehose
   * @param name - Firehose name
   * @param options - Firehose options
   */
  constructor(
    public readonly name: string,
    private readonly options: FirehoseOptions<Type, Data, CustomHeaders, CustomOptions>
  ) {
    super();
    // Stryker disable next-line all
    this.logger = SetContext(
      this.options?.logger || new DebugLogger(`mdf:firehose:${this.name}`),
      this.name,
      this.componentId
    );
    if (this.options.sinks.length < 1) {
      throw new Crash(`Firehose must have at least one sink`, this.componentId);
    }
    if (this.options.sources.length < 1) {
      throw new Crash(`Firehose must have at least one source`, this.componentId);
    }
    const { sinks, sources, engine, metricsHandler } = this.bootstrap();
    this.sinks = sinks;
    this.sources = sources;
    this.engine = engine;
    this.metricsHandler = metricsHandler;
    this.stopping = false;
  }
  /** Engine hold event handler */
  private readonly onHoldEvent = async () => {
    // Stryker disable next-line all
    this.logger.warn(`Hold time reached, informing to the upper layers ...`);
    this.emit('hold');
  };
  /** Sink/Source/Engine/Plug error event handler */
  private readonly onErrorEvent = (error: Error | Crash) => {
    // Stryker disable next-line all
    this.logger.error(`${error.message}`);
    if (this.listenerCount('error') > 0) {
      this.emit('error', error);
    }
  };
  /** Sink/Source/Engine error event handler */
  private readonly onStatusEvent = (status: Health.Status) => {
    // Stryker disable next-line all
    this.logger.debug(`Status message received from underlayer streams ${status}`);
    this.emit('status', this.status);
  };
  /** Source job create event handler */
  private readonly onJobEvent = (
    job: Jobs.JobHandler<Type, Data, CustomHeaders, CustomOptions>
  ) => {
    this.emit('job', job.toObject());
  };
  /** Source job done error event handler */
  private readonly onJobDoneEvent = (uuid: string, result: Jobs.Result, error?: Crash) => {
    if (error) {
      this.onErrorEvent(
        new Crash(`Job finished with errors`, error.uuid, {
          cause: error,
          info: { subject: 'firehose' },
        })
      );
    }
    this.emit('done', uuid, result, error);
  };
  /** Sink lost event handler */
  private readonly onLostEvent = (sink: Writable) => {
    if (!this.stopping) {
      this.engine.pipe(sink);
      this.engine.resume();
    }
  };
  /** Perform the subscription to the events from sources, sinks and engine */
  private wrappingEvents(): void {
    for (const source of this.options.sources) {
      source.on('error', this.onErrorEvent);
    }
    for (const sink of this.options.sinks) {
      sink.on('error', this.onErrorEvent);
    }
    for (const source of this.sources) {
      source.plugWrapper.on('error', this.onErrorEvent);
      source.on('error', this.onErrorEvent);
      source.on('status', this.onStatusEvent);
      source.on('done', this.onJobDoneEvent);
      source.on('job', this.onJobEvent);
    }
    for (const sink of this.sinks) {
      sink.plugWrapper.on('error', this.onErrorEvent);
      sink.on('error', this.onErrorEvent);
      sink.on('status', this.onStatusEvent);
      sink.on('lost', this.onLostEvent);
    }
    this.engine.on('error', this.onErrorEvent);
    this.engine.on('status', this.onStatusEvent);
    this.engine.on('hold', this.onHoldEvent);
  }
  /** Perform the unsubscription to the events from sources, sinks and engine */
  private unWrappingEvents(): void {
    for (const source of this.options.sources) {
      source.off('error', this.onErrorEvent);
    }
    for (const sink of this.options.sinks) {
      sink.off('error', this.onErrorEvent);
    }
    for (const source of this.sources) {
      source.off('error', this.onErrorEvent);
      source.off('status', this.onStatusEvent);
      source.off('done', this.onJobDoneEvent);
    }
    for (const sink of this.sinks) {
      sink.off('error', this.onErrorEvent);
      sink.off('status', this.onStatusEvent);
      sink.off('lost', this.onLostEvent);
    }
    this.engine.off('error', this.onErrorEvent);
    this.engine.off('status', this.onStatusEvent);
    this.engine.off('hold', this.onHoldEvent);
  }
  /** Perform the bootstrapping of the firehose */
  private bootstrap(): {
    sinks: Sinks[];
    sources: Sources[];
    engine: Engine;
    metricsHandler: MetricsHandler;
  } {
    const _sinks = Helpers.GetSinkStreamsFromPlugs(this.options.sinks, this.options);
    const _sources = Helpers.GetSourceStreamsFromPlugs(
      this.options.sources,
      this.options,
      this.options.atLeastOne ? 1 : _sinks.length
    );
    const _metricHandler = new MetricsHandler();
    for (const sink of _sinks) {
      _metricHandler.enroll(sink);
    }
    for (const source of _sources) {
      _metricHandler.enroll(source);
    }
    const _engine = new Engine(this.name, {
      strategies: this.options.strategies,
      transformOptions: { highWaterMark: this.options.bufferSize },
      logger: this.options.logger,
      maxInactivityTime: this.options.maxInactivityTime,
    });
    return { sinks: _sinks, sources: _sources, engine: _engine, metricsHandler: _metricHandler };
  }
  /** Perform the piping of all the streams */
  public async start(): Promise<void> {
    this.wrappingEvents();
    const startedPlugs = [];
    try {
      for (const sink of this.sinks) {
        // Stryker disable next-line all
        this.logger.info(`Starting sink ${sink.name} ...`);
        await sink.start();
        // Stryker disable next-line all
        this.logger.info(`... sink ${sink.name} started`);
        startedPlugs.push(sink);
      }
      for (const source of this.sources) {
        // Stryker disable next-line all
        this.logger.info(`Starting source ${source.name} ...`);
        await source.start();
        // Stryker disable next-line all
        this.logger.info(`... source ${source.name} started`);
        startedPlugs.push(source);
      }
      // Wait for all the plugs to be started before starting the engine
      for (const sink of this.sinks) {
        this.engine.pipe(sink);
      }
      for (const source of this.sources) {
        source.pipe(this.engine);
      }
      this.engine.start();
    } catch (rawError) {
      const error = Crash.from(rawError);
      // Stryker disable next-line all
      this.logger.error(`Error starting firehose: ${error.message}`);
      // Stryker disable next-line all
      this.logger.warn(`Stopping all the already started plugs ...`);
      for (const plug of startedPlugs) {
        // Stryker disable next-line all
        this.logger.warn(`Stopping plug ${plug.name} ...`);
        await plug.stop();
        // Stryker disable next-line all
        this.logger.warn(`... plug ${plug.name} stopped`);
      }
      throw error;
    }
  }
  /** Stop the active sink and source and unpipe them from the engine */
  public async stop(): Promise<void> {
    this.stopping = true;
    this.unWrappingEvents();
    this.engine.stop();
    for (const sink of this.sinks) {
      await sink.stop();
      this.engine.unpipe(sink);
    }
    for (const source of this.sources) {
      await source.stop();
      source.unpipe(this.engine);
    }
    this.stopping = false;
  }
  /** Stop and close all the streams */
  public async close(): Promise<void> {
    await this.stop();
    this.metricsHandler.registry.clear();
    this.engine.close();

    for (const sink of this.sinks) {
      sink.end();
      sink.destroy();
      sink.removeAllListeners();
    }
    for (const source of this.sources) {
      source.destroy();
      source.removeAllListeners();
    }
    this.sinks.length = 0;
    this.sources.length = 0;
  }
  /** Perform the restart of the firehose */
  public async restart(): Promise<void> {
    await this.close();
    const { sinks, sources, engine, metricsHandler } = this.bootstrap();
    this.sinks = sinks;
    this.sources = sources;
    this.engine = engine;
    this.metricsHandler = metricsHandler;
    await this.start();
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
    for (const source of this.sources) {
      overallChecks = { ...source.checks, ...overallChecks };
    }
    for (const sink of this.sinks) {
      overallChecks = { ...sink.checks, ...overallChecks };
    }
    return { ...this.engine.checks, ...overallChecks };
  }
  /** Return the metrics registry */
  public get metrics(): Registry {
    return this.metricsHandler.registry;
  }
}
