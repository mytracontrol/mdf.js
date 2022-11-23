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
import { MetricsHandler } from './metrics';
import * as Sink from './Sink';
import * as Source from './Source';
import {
  FirehoseOptions,
  Plugs,
  Sinks,
  Sources,
  WrappableSinkPlug,
  WrappableSourcePlug,
} from './types';

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
  private readonly sinks: Sinks<Type, Data, CustomHeaders>[];
  /** Source streams */
  private readonly sources: Sources<Type, Data, CustomHeaders>[];
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
    this.sinks = this.getSinkStreams(this.options.sinks);
    if (this.options.sources.length < 1) {
      throw new Crash(`Firehose must have at least one source`, this.componentId);
    }
    this.sources = this.getSourceStreams(
      this.options.sources,
      this.options.atLeastOne ? 1 : this.sinks.length
    );
    this.engine = new Engine<Type, Data, CustomHeaders>(this.name, {
      strategies: this.options.strategies,
      transformOptions: { highWaterMark: this.options.bufferSize },
      logger: this.options.logger,
    });
    if (this.options.metricsService) {
      this.metricsHandler = MetricsHandler.enroll(this.options.metricsService);
      for (const source of this.sources) {
        this.metricsHandler.register(source);
      }
    }
    this.errorRegisterHandler = this.options.registerService;
    this.stopping = false;
  }
  /**
   * Create source streams from source plugs
   * @param sources - Source plugs to be processed
   * @param qos - indicates the quality of service for the job, indeed this indicate the number of
   * sinks that must be successfully processed to consider the job as successfully processed
   * @returns
   */
  private getSourceStreams(
    sources: Plugs.Source.Any<Type, Data, CustomHeaders>[],
    qos = 1
  ): Sources<Type, Data, CustomHeaders>[] {
    const sourceStreams: Sources<Type, Data, CustomHeaders>[] = [];
    for (const source of sources) {
      if (this.isFlowSource(source)) {
        sourceStreams.push(
          new Source.Flow<Type, Data, CustomHeaders>(source, {
            retryOptions: this.options.retryOptions,
            qos,
            readableOptions: { highWaterMark: this.options.bufferSize },
            postConsumeOptions: this.options.postConsumeOptions,
            logger: this.options.logger,
          })
        );
      } else if (this.isSequenceSource(source)) {
        sourceStreams.push(
          new Source.Sequence<Type, Data, CustomHeaders>(source, {
            retryOptions: this.options.retryOptions,
            qos,
            readableOptions: { highWaterMark: this.options.bufferSize },
            postConsumeOptions: this.options.postConsumeOptions,
            logger: this.options.logger,
          })
        );
      } else {
        throw new Crash(`Source type not supported`, this.componentId);
      }
    }
    return sourceStreams;
  }
  /**
   * Create sinks streams from sink plugs
   * @param sinks - Sinks plugs to be processed
   * @returns
   */
  private getSinkStreams(
    sinks: Plugs.Sink.Any<Type, Data, CustomHeaders>[]
  ): Sinks<Type, Data, CustomHeaders>[] {
    const sinkStreams: Sinks<Type, Data, CustomHeaders>[] = [];
    for (const sink of sinks) {
      if (this.isJetSink(sink)) {
        sinkStreams.push(
          new Sink.Jet(sink, {
            retryOptions: this.options.retryOptions,
            writableOptions: { highWaterMark: this.options.bufferSize },
            logger: this.options.logger,
          })
        );
      } else if (this.isTapSink(sink)) {
        sinkStreams.push(
          new Sink.Tap(sink, {
            retryOptions: this.options.retryOptions,
            writableOptions: { highWaterMark: this.options.bufferSize },
            logger: this.options.logger,
          })
        );
      } else {
        throw new Crash(`Sink type not supported`, this.componentId);
      }
    }
    return sinkStreams;
  }
  /**
   * Check if a source is a valid Flow Source
   * @param source - source to be checked
   * @returns
   */
  private isFlowSource(
    source: WrappableSourcePlug<Type, Data, CustomHeaders>
  ): source is Plugs.Source.Flow<Type, Data, CustomHeaders> {
    return typeof source.postConsume === 'function' && typeof source.ingestData === 'undefined';
  }
  /**
   * Check if a source is a valid Sequence Source
   * @param source - source to be checked
   * @returns
   */
  private isSequenceSource(
    source: WrappableSourcePlug<Type, Data, CustomHeaders>
  ): source is Plugs.Source.Sequence<Type, Data, CustomHeaders> {
    return typeof source.postConsume === 'function' && typeof source.ingestData === 'function';
  }
  /**
   * Check if a sink is a valid Tap Sink
   * @param sink - sink to be checked
   * @returns
   */
  private isTapSink(
    sink: WrappableSinkPlug<Type, Data, CustomHeaders>
  ): sink is Plugs.Sink.Tap<Type, Data, CustomHeaders> {
    return typeof sink.single === 'function' && typeof sink.multi === 'undefined';
  }
  /**
   * Check if a sink is a valid Jet Sink
   * @param sink - sink to be checked
   * @returns
   */
  private isJetSink(
    sink: WrappableSinkPlug<Type, Data, CustomHeaders>
  ): sink is Plugs.Sink.Jet<Type, Data, CustomHeaders> {
    return typeof sink.multi === 'function' && typeof sink.single === 'function';
  }
  /** Sink/Source/Engine error event handler */
  private readonly onErrorEvent = (error: Error | Crash) => {
    // Stryker disable next-line all
    this.logger.error(`${error.message}`);
    this.emit('error', error);
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
    for (const source of this.sources) {
      source.on('error', this.onErrorEvent);
      source.on('status', this.onStatusEvent);
      source.on('done', this.onJobDoneEvent);
      source.on('job', this.onJobEvent);
    }
    for (const sink of this.sinks) {
      sink.on('error', this.onErrorEvent);
      sink.on('status', this.onStatusEvent);
      sink.on('lost', this.onLostEvent);
    }
    this.engine.on('error', this.onErrorEvent);
    this.engine.on('status', this.onStatusEvent);
  }
  /** Perform the unsubscription to the events from sources, sinks and engine */
  private unWrappingEvents(): void {
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
    this.wrappingEvents();
    for (const sink of this.sinks) {
      this.engine.pipe(sink);
      await sink.start();
    }
    for (const source of this.sources) {
      source.pipe(this.engine);
      await source.start();
    }
  }
  /** Perform the unpipe of all the streams */
  public async stop(): Promise<void> {
    this.stopping = true;
    this.unWrappingEvents();
    for (const sink of this.sinks) {
      this.engine.unpipe(sink);
      await sink.stop();
    }
    for (const source of this.sources) {
      source.unpipe(this.engine);
      await source.stop();
    }
  }
  /** Stop and close all the streams */
  public close(): void {
    this.stop();
    this.engine.end();
    this.engine.destroy();
    this.engine.removeAllListeners();
    for (const sink of this.sinks) {
      sink.end();
      sink.destroy();
      sink.removeAllListeners();
    }
    for (const source of this.sources) {
      source.destroy();
      source.removeAllListeners();
    }
  }
}
