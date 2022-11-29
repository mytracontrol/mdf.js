/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health, Jobs } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { DebugLogger, LoggerInstance, SetContext } from '@mdf.js/logger';
import { Service as RegisterService } from '@mdf.js/register-service';
import { overallStatus } from '@mdf.js/utils';
import EventEmitter from 'events';
import { Writable } from 'stream';
import { v4 } from 'uuid';
import { Engine } from './Engine';
import { Helpers } from './helpers';
import { MetricsHandler } from './metrics';
import { FirehoseOptions, Sinks, Sources } from './types';

export declare interface Firehose<
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, any> = Record<string, any>
> {
  /** Due to the implementation of consumer classes, this event will never emitted */
  on(event: 'error', listener: (error: Error | Crash) => void): this;
  /** Emitted on every state change */
  on(event: 'status', listener: (status: Health.API.Status) => void): this;
  /** Emitted when a job is created */
  on(event: 'job', listener: (job: Jobs.JobObject<Type, Data, CustomHeaders>) => void): this;
  /** Emitted when a job has ended */
  on(event: 'done', listener: (uuid: string, result: Jobs.Result, error?: Crash) => void): this;
}

export class Firehose<
    Type extends string = string,
    Data = any,
    CustomHeaders extends Record<string, any> = Record<string, any>
  >
  extends EventEmitter
  implements Health.Component
{
  /** Debug logger for development and deep troubleshooting */
  private readonly logger: LoggerInstance;
  /** Provider unique identifier for trace purposes */
  readonly componentId: string = v4();
  /** Engine stream */
  private readonly engine: Engine<Type, Data, CustomHeaders>;
  /** Sink streams */
  private readonly sinks: Sinks<Type, Data, CustomHeaders>[] = [];
  /** Source streams */
  private readonly sources: Sources<Type, Data, CustomHeaders>[] = [];
  /** Metrics handler */
  private readonly metricsHandler?: MetricsHandler;
  /** Error registry handler */
  private readonly errorRegisterHandler?: RegisterService;
  /** Flag to indicate that an stop request has been received */
  private stopping: boolean;
  /**
   * Create a new instance for a firehose
   * @param name - Firehose name
   * @param options - Firehose options
   */
  constructor(
    public readonly name: string,
    private readonly options: FirehoseOptions<Type, Data, CustomHeaders>
  ) {
    super();
    // Stryker disable next-line all
    this.logger = SetContext(
      options?.logger || new DebugLogger(`mdf:firehose:${this.name}`),
      this.name,
      this.componentId
    );
    if (this.options.sinks.length < 1) {
      throw new Crash(`Firehose must have at least one sink`, this.componentId);
    }
    if (this.options.sources.length < 1) {
      throw new Crash(`Firehose must have at least one source`, this.componentId);
    }
    this.engine = new Engine<Type, Data, CustomHeaders>(this.name, {
      strategies: this.options.strategies,
      transformOptions: { highWaterMark: this.options.bufferSize },
      logger: this.options.logger,
    });
    this.errorRegisterHandler = this.options.errorsRegistry;
    if (this.options.metricsRegistry) {
      this.metricsHandler = MetricsHandler.enroll(this.options.metricsRegistry);
    }
    this.stopping = false;
  }
  /** Sink/Source/Engine/Plug error event handler */
  private readonly onErrorEvent = (error: Error | Crash) => {
    // Stryker disable next-line all
    this.logger.error(`${error.message}`);
    if (this.errorRegisterHandler) {
      this.errorRegisterHandler.push(Crash.from(error));
    }
    if (this.listenerCount('error') > 0) {
      this.emit('error', error);
    }
  };
  /** Sink/Source/Engine error event handler */
  private readonly onStatusEvent = (status: Health.API.Status) => {
    // Stryker disable next-line all
    this.logger.debug(`Status message received from underlayer streams ${status}`);
    this.emit('status', this.overallStatus);
  };
  /** Source job create event handler */
  private readonly onJobEvent = (job: Jobs.JobHandler<Type, Data>) => {
    this.emit('job', job.toObject());
  };
  /** Source job done error event handler */
  private readonly onJobDoneEvent = (uuid: string, result: Jobs.Result, error?: Crash) => {
    if (error && this.errorRegisterHandler) {
      this.errorRegisterHandler.push(
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
  }
  /** Overall component status */
  private get overallStatus(): Health.API.Status {
    return overallStatus(this.checks);
  }
  /**
   * Return the status of the firehose in a standard format
   * @returns _check object_ as defined in the draft standard
   * https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check-05
   */
  public get checks(): Health.API.Checks {
    let overallChecks: Health.API.Checks = {};
    for (const source of this.sources) {
      overallChecks = { ...source.checks, ...overallChecks };
    }
    for (const sink of this.sinks) {
      overallChecks = { ...sink.checks, ...overallChecks };
    }
    return { ...this.engine.checks, ...overallChecks };
  }
  /** Perform the piping of all the streams */
  public async start(): Promise<void> {
    this.sinks.push(...Helpers.GetSinkStreamsFromPlugs(this.options.sinks, this.options));
    this.sources.push(
      ...Helpers.GetSourceStreamsFromPlugs(
        this.options.sources,
        this.options,
        this.options.atLeastOne ? 1 : this.sinks.length
      )
    );
    if (this.metricsHandler) {
      for (const source of this.sources) {
        this.metricsHandler.register(source);
      }
    }
    this.wrappingEvents();
    for (const sink of this.sinks) {
      await sink.start();
      this.engine.pipe(sink);
    }
    for (const source of this.sources) {
      await source.start();
      source.pipe(this.engine);
    }
  }
  /** Perform the unpipe of all the streams */
  public async stop(): Promise<void> {
    this.stopping = true;
    this.unWrappingEvents();
    for (const sink of this.sinks) {
      await sink.stop();
      this.engine.unpipe(sink);
      sink.end();
      sink.destroy();
      sink.removeAllListeners();
    }
    for (const source of this.sources) {
      await source.stop();
      source.unpipe(this.engine);
      source.destroy();
      source.removeAllListeners();
    }
    this.sinks.length = 0;
    this.sources.length = 0;
  }
  /** Stop and close all the streams */
  public close(): void {
    this.stop();
    this.engine.end();
    this.engine.destroy();
    this.engine.removeAllListeners();
  }
}
