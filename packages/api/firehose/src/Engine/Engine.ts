/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Health, JobHandler, Jobs } from '@mdf.js/core';
import { Crash, Multi } from '@mdf.js/crash';
import { DebugLogger, LoggerInstance, SetContext } from '@mdf.js/logger';
import { get, merge } from 'lodash';
import { Transform } from 'stream';
import { v4 } from 'uuid';
import { EngineOptions } from '../types';

import { DEFAULT_TRANSFORM_OPTIONS } from './const';

export declare interface Engine {
  /** Emitted when it is appropriate to resume writing data to the stream */
  on(event: 'drain', listener: () => void): this;
  /** Emitted when stream.resume() is called and readableFlowing is not true */
  on(event: 'resume', listener: () => void): this;
  /** Emitted when there is data available to be read from the stream */
  on(event: 'readable', listener: () => void): this;
  /** Emitted when stream.pause() is called and readableFlowing is not false */
  on(event: 'pause', listener: () => void): this;
  /** Due to the implementation of consumer classes, this event will never emitted */
  on(event: 'error', listener: (error: Error | Crash) => void): this;
  /** Emitted when there is no more data to be consumed from the stream */
  on(event: 'end', listener: () => void): this;
  /** Emitted whenever the stream is relinquishing ownership of a chunk of data to a consumer */
  on(event: 'data', listener: (chunk: Buffer | string | any) => void): this;
  /** Emitted when the stream have been closed */
  on(event: 'close', listener: () => void): this;
  /** Emitted on every state change */
  on(event: 'status', listener: (providerState: Health.API.Status) => void): this;
}

export class Engine<Type extends string = string, Data = any>
  extends Transform
  implements Health.Component
{
  /** Provider unique identifier for trace purposes */
  readonly componentId: string = v4();
  /** Debug logger for development and deep troubleshooting */
  private readonly logger: LoggerInstance;
  /** Store the last error emitted by the super class */
  private error?: Crash | Multi;
  /**
   * Create a new instance of the datapoint filter stream
   * @param name - name of the transform
   * @param options - engine options
   */
  constructor(public readonly name: string, private readonly options?: EngineOptions<Type, Data>) {
    super(merge(DEFAULT_TRANSFORM_OPTIONS, options));
    // Stryker disable next-line all
    this.logger = SetContext(
      options?.logger || new DebugLogger(`stream:engine:${name}`),
      'Engine',
      this.componentId
    );
    this.wrappingEvents();
  }
  /**
   * Perform the filter strategy depending of the job type
   * @param job - publication job object
   */
  override _transform(
    job: JobHandler<Type, Data>,
    encoding: string,
    callback: (error?: Crash, chunk?: any) => void
  ): void {
    // Stryker disable next-line all
    this.logger.debug(`Appling filters to a ${job.type} - ${job.uuid}`);
    const strategies = get(this.options?.strategies, job.type, []);
    for (const strategy of strategies) {
      const hrStart = process.hrtime();
      job = this.executeStrategy(job, strategy);
      const hrEnd = process.hrtime(hrStart);
      // Stryker disable all
      this.logger.debug(
        `Working time for strategy [${strategy.name}] - time (hr): ${hrEnd[0]}s ${
          hrEnd[1] / 1000000
        }ms`
      );
      // Stryker enable all
    }
    // Stryker disable next-line all
    this.logger.debug(`Filters applied to a ${job.type} - ${job.uuid}`);
    callback(undefined, job);
  }
  /**
   * Execute an strategy
   * @param job - job to be processed
   * @param strategy - strategy to be applied
   * @returns
   */
  private executeStrategy(
    job: JobHandler<any>,
    strategy: Jobs.Strategy<Type, Data>
  ): JobHandler<Type, Data> {
    try {
      const result = strategy.do(job.toObject());
      if (!result || result.data === undefined || result.data === null) {
        job.addError(
          new Crash(
            `Strategy ${strategy.name} return an undefined job or a job with no data, it has not be applied`,
            this.componentId
          )
        );
      } else {
        job.data = result.data;
      }
    } catch (rawError) {
      const error = Crash.from(rawError);
      job.addError(
        new Crash(
          `Strategy ${strategy.name} throw an error during process: ${error.message}, it has not be applied`,
          this.componentId,
          { cause: error }
        )
      );
    }
    return job;
  }
  /**
   * Return the status of the stream in a standard format
   * @returns _check object_ as defined in the draft standard
   * https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check-05
   */
  public get checks(): Health.API.Checks {
    return {
      [`${this.name}:stream`]: [
        {
          status: this.ownStatus,
          componentId: this.componentId,
          componentType: 'stream',
          observedValue: `${this.writableLength}/${this.writableHighWaterMark}`,
          observedUnit: 'writable jobs',
          time: new Date().toISOString(),
          output: this.detailedOutput(),
        },
        {
          status: this.ownStatus,
          componentId: this.componentId,
          componentType: 'stream',
          observedValue: `${this.readableLength}/${this.readableHighWaterMark}`,
          observedUnit: 'readable jobs',
          time: new Date().toISOString(),
          output: this.detailedOutput(),
        },
      ],
    };
  }
  /** Return the status of the stream in the standard format */
  private get ownStatus(): Health.API.Status {
    if (!this.writable || !this.readable) {
      return 'fail';
    } else if (
      this.writableLength >= this.writableHighWaterMark ||
      this.readableLength >= this.readableHighWaterMark
    ) {
      return 'warn';
    } else {
      return 'pass';
    }
  }
  /** Create a detailed output for errors */
  private detailedOutput(): string | string[] | undefined {
    if (this.ownStatus === 'fail' && this.error) {
      return this.error.trace();
    } else {
      return undefined;
    }
  }
  /** Super error event handler */
  private readonly onErrorEvent = (rawError: Error | Crash) => {
    this.error = Crash.from(rawError, this.componentId);
    // Stryker disable next-line all
    this.logger.error(`Error in engine stream ${this.name}: ${this.error.message}`);
    this.emit('status', this.ownStatus);
  };
  /** Super close event handler */
  private readonly onCloseEvent = () => {
    // Stryker disable next-line all
    this.logger.info(`Engine stream ${this.name} has been closed`);
    this.emit('status', this.ownStatus);
  };
  /** Super drain event handler */
  private readonly onDrainEvent = () => {
    // Stryker disable next-line all
    this.logger.debug(`Engine stream ${this.name} has been drained`);
    this.emit('status', this.ownStatus);
  };
  /** Super pause event handler */
  private readonly onPauseEvent = () => {
    // Stryker disable next-line all
    this.logger.debug(`Engine stream ${this.name} has been paused`);
    this.emit('status', this.ownStatus);
  };
  /** Wrap super and plug events in the same to aggregate them in one component */
  private wrappingEvents(): void {
    super.on('error', this.onErrorEvent);
    super.on('close', this.onCloseEvent);
    super.on('drain', this.onDrainEvent);
    super.on('pause', this.onPauseEvent);
  }
}
