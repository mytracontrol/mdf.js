/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Mytra Control S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Mytra Control S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Mytra Control S.L.
 */

import { Health, JobHandler, Jobs } from '@mdf/core';
import { Crash } from '@mdf/crash';
import { Service as RegisterService } from '@mdf/register-service';
import { overallStatus } from '@mdf/utils';
import Debug, { Debugger } from 'debug';
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

export declare interface Firehose<Type, Data> {
  /** Due to the implementation of consumer classes, this event will never emitted */
  on(event: 'error', listener: (error: Error | Crash) => void): this;
  /** Emitted on every state change */
  on(event: 'status', listener: (status: Health.API.Status) => void): this;
  /** Emitted when a job is created */
  on(event: 'job', listener: (job: Jobs.Object<Type, Data>) => void): this;
  /** Emitted when a job has ended */
  on(event: 'done', listener: (uuid: string, result: Jobs.Result, error?: Crash) => void): this;
}

export class Firehose<Type extends string = string, Data = any>
  extends EventEmitter
  implements Health.Component
{
  /** Debug logger for development and deep troubleshooting */
  private readonly logger: Debugger;
  /** Provider unique identifier for trace purposes */
  readonly componentId: string = v4();
  /** Engine stream */
  private readonly engine: Engine;
  /** Sink streams */
  private readonly sinks: Sinks[];
  /** Source streams */
  private readonly sources: Sources[];
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
  constructor(public readonly name: string, private readonly options: FirehoseOptions) {
    super();
    // Stryker disable next-line all
    this.logger = Debug(`mdf:firehose:${this.name}`);
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
    this.engine = new Engine(this.name, this.options.strategies, {
      highWaterMark: this.options.bufferSize,
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
  private getSourceStreams(sources: Plugs.Source.Any[], qos = 1): Sources[] {
    const sourceStreams: Sources[] = [];
    for (const source of sources) {
      if (this.isFlowSource(source)) {
        sourceStreams.push(
          new Source.Flow(source, {
            retryOptions: this.options.retryOptions,
            qos,
            readableOptions: { highWaterMark: this.options.bufferSize },
            postConsumeOptions: this.options.postConsumeOptions,
          })
        );
      } else if (this.isSequenceSource(source)) {
        sourceStreams.push(
          new Source.Sequence(source, {
            retryOptions: this.options.retryOptions,
            qos,
            readableOptions: { highWaterMark: this.options.bufferSize },
            postConsumeOptions: this.options.postConsumeOptions,
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
  private getSinkStreams(sinks: Plugs.Sink.Any[]): Sinks[] {
    const sinkStreams: Sinks[] = [];
    for (const sink of sinks) {
      if (this.isJetSink(sink)) {
        sinkStreams.push(
          new Sink.Jet(sink, this.options.retryOptions, {
            highWaterMark: this.options.bufferSize,
          })
        );
      } else if (this.isTapSink(sink)) {
        sinkStreams.push(
          new Sink.Tap(sink, this.options.retryOptions, {
            highWaterMark: this.options.bufferSize,
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
  private isFlowSource(source: WrappableSourcePlug): source is Plugs.Source.Flow {
    return typeof source.postConsume === 'function' && typeof source.ingestData === 'undefined';
  }
  /**
   * Check if a source is a valid Sequence Source
   * @param source - source to be checked
   * @returns
   */
  private isSequenceSource(source: WrappableSourcePlug): source is Plugs.Source.Sequence {
    return typeof source.postConsume === 'function' && typeof source.ingestData === 'function';
  }
  /**
   * Check if a sink is a valid Tap Sink
   * @param sink - sink to be checked
   * @returns
   */
  private isTapSink(sink: WrappableSinkPlug): sink is Plugs.Sink.Tap {
    return typeof sink.single === 'function' && typeof sink.multi === 'undefined';
  }
  /**
   * Check if a sink is a valid Jet Sink
   * @param sink - sink to be checked
   * @returns
   */
  private isJetSink(sink: WrappableSinkPlug): sink is Plugs.Sink.Jet {
    return typeof sink.multi === 'function' && typeof sink.single === 'function';
  }
  /** Sink/Source/Engine error event handler */
  private onErrorEvent = (error: Error | Crash) => {
    // Stryker disable next-line all
    this.logger(`${error.message}`);
    this.emit('error', error);
  };
  /** Sink/Source/Engine error event handler */
  private onStatusEvent = (status: Health.API.Status) => {
    // Stryker disable next-line all
    this.logger(`Status message received from underlayer streams ${status}`);
    this.emit('status', this.overallStatus);
  };
  /** Source job create event handler */
  private onJobEvent = (job: JobHandler<Type, Data>) => {
    this.emit('job', job.toObject());
  };
  /** Source job done error event handler */
  private onJobDoneEvent = (uuid: string, result: Jobs.Result, error?: Crash) => {
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
  private onLostEvent = (sink: Writable) => {
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
  public start(): void {
    this.wrappingEvents();
    for (const sink of this.sinks) {
      this.engine.pipe(sink);
    }
    for (const source of this.sources) {
      source.pipe(this.engine);
    }
  }
  /** Perform the unpipe of all the streams */
  public stop(): void {
    this.stopping = true;
    this.unWrappingEvents();
    for (const sink of this.sinks) {
      this.engine.unpipe(sink);
    }
    for (const source of this.sources) {
      source.unpipe(this.engine);
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
