/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health, Jobs } from '@mdf.js/core';
import { Crash, Multi } from '@mdf.js/crash';
import { DebugLogger, LoggerInstance, SetContext } from '@mdf.js/logger';
import { overallStatus } from '@mdf.js/utils';
import { merge } from 'lodash';
import { Readable } from 'stream';
import { Plugs, SourceOptions } from '../../types';
import { DEFAULT_READABLE_OPTIONS } from './const';
import { PlugWrapper } from './PlugWrapper';

export declare interface Base<
  T extends Plugs.Source.Any<Type, Data, CustomHeaders>,
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, any> = Record<string, any>
> {
  /** Emitted when stream.resume() is called and readableFlowing is not true*/
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
  on(event: 'status', listener: (status: Health.API.Status) => void): this;
  /** Emitted when a job is created */
  on(event: 'job', listener: (job: Jobs.JobHandler<Type, Data, CustomHeaders>) => void): this;
  /** Emitted when a job has ended */
  on(
    event: 'done',
    listener: (uuid: string, result: Jobs.Result<Type>, error?: Crash) => void
  ): this;
}

/** Firehose source (Readable) plug class */
export abstract class Base<
    T extends Plugs.Source.Any<Type, Data, CustomHeaders>,
    Type extends string = string,
    Data = any,
    CustomHeaders extends Record<string, any> = Record<string, any>
  >
  extends Readable
  implements Health.Component
{
  /** Debug logger for development and deep troubleshooting */
  protected readonly logger: LoggerInstance;
  /** Store the last error detected in the stream */
  protected error?: Multi | Crash;
  /** Flag to indicate that an unhealthy status has been emitted recently */
  private lastStatusEmitted?: Health.API.Status;
  /** Wrapped source plug */
  private readonly plugWrapper: PlugWrapper<Type, Data, CustomHeaders>;
  /**
   * Indicates the quality of service for the job, indeed this indicate the number of sinks that
   * must be successfully processed to consider the job as successfully processed
   */
  protected readonly qos: number = 1;
  /**
   * Create a new instance for the firehose source
   * @param plug - source plug instance
   * @param options - source options
   */
  constructor(protected readonly plug: T, options?: SourceOptions) {
    super(merge(DEFAULT_READABLE_OPTIONS, options?.readableOptions));
    this.qos = options?.qos ?? this.qos;
    // Stryker disable next-line all
    this.logger = SetContext(
      options?.logger || new DebugLogger(`mdf:stream:source:${this.plug.name}`),
      'Source',
      this.plug.componentId
    );
    this.plugWrapper = new PlugWrapper(
      this.plug,
      options?.retryOptions,
      options?.postConsumeOptions
    );
    this.wrappingEvents(this.plug);
  }
  /** Component identification */
  public get componentId(): string {
    return this.plug.componentId;
  }
  /** Component name */
  public get name(): string {
    return this.plug.name;
  }
  /**
   * Return the status of the stream in a standard format
   * @returns _check object_ as defined in the draft standard
   * https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check-05
   */
  public get checks(): Health.API.Checks {
    return {
      ...this.plugWrapper.checks,
      [`${this.name}:stream`]: [
        {
          status: this.ownStatus,
          componentId: this.componentId,
          componentType: 'stream',
          observedValue: `${this.readableLength}/${this.readableHighWaterMark}`,
          observedUnit: 'jobs',
          time: new Date().toISOString(),
          output: this.detailedOutput(),
        },
      ],
    };
  }
  /** Overall component status */
  private get overallStatus(): Health.API.Status {
    return overallStatus(this.checks);
  }
  /** Return the status of the stream in the standard format */
  private get ownStatus(): Health.API.Status {
    if (!this.readable) {
      return 'fail';
    } else if (this.readableLength >= this.readableHighWaterMark || !this.readableFlowing) {
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
  /** Emit the status if it's different from the last emitted status */
  private emitStatus(): void {
    if (this.lastStatusEmitted !== this.overallStatus) {
      this.lastStatusEmitted = this.overallStatus;
      this.emit('status', this.overallStatus);
    }
  }
  /** Super/Plug error event handler */
  private readonly onErrorEvent = (rawError: Error | Crash) => {
    this.error = Crash.from(rawError, this.componentId);
    // Stryker disable next-line all
    this.logger.error(`Error in source stream ${this.name}: ${this.error.message}`);
    this.emitStatus();
  };
  /** Plug status event handler */
  private readonly onStatusEvent = () => {
    this.emitStatus();
  };
  /** Super pause event handler */
  private readonly onPauseEvent = () => {
    // Stryker disable next-line all
    this.logger.debug(`Source stream ${this.plug.name} has been paused`);
    this.emitStatus();
  };
  /** Super resume event handler */
  private readonly onResumeEvent = () => {
    // Stryker disable next-line all
    this.logger.debug(`Source stream ${this.plug.name} has been resumed`);
    this.emitStatus();
  };
  /** Super close event handler */
  private readonly onCloseEvent = () => {
    // Stryker disable next-line all
    this.logger.info(`Source stream ${this.plug.name} has been closed`);
    this.emitStatus();
  };
  /** Wrap super and plug events in the same to aggregate them in one component */
  private wrappingEvents(plug: Plugs.Source.Any): void {
    super.on('error', this.onErrorEvent);
    super.on('pause', this.onPauseEvent);
    super.on('resume', this.onResumeEvent);
    super.on('close', this.onCloseEvent);
    plug.on('error', this.onErrorEvent);
    plug.on('status', this.onStatusEvent);
    this.plugWrapper.on('status', this.onStatusEvent);
  }
  /** Manage the `done` event of a job */
  private readonly onJobDone = (uuid: string, jobResult: Jobs.Result, error?: Crash) => {
    if (error) {
      // Stryker disable next-line all
      this.logger.debug(`Job ${jobResult.id} was finished with error: ${error.message}`);
    }
    this.plug
      .postConsume(jobResult.jobId)
      .then(postConsumeResult => {
        if (postConsumeResult) {
          // Stryker disable next-line all
          this.logger.silly(`Job [${jobResult.jobId}] resolved properly`);
        } else {
          // Stryker disable next-line all
          this.logger.silly(`Job [${jobResult.jobId}] resolved with no result`);
        }
      })
      .catch(plugError => {
        // Stryker disable next-line all
        this.logger.error(
          `Job [${jobResult.jobId}] was not cleaned due to error: ${plugError.message}`
        );
      })
      .finally(() => this.emit('done', uuid, jobResult, error));
  };
  /**
   * Manage the events of the jobs
   * @param job - job object
   */
  protected subscribeJob(job: Jobs.JobHandler<Type, Data, CustomHeaders>): Jobs.JobHandler<any> {
    job.once('done', this.onJobDone);
    this.emit('job', job);
    return job;
  }
  /** Perform the read of data from the source */
  abstract override _read(size: number): void;
  /** Start the Plug and the underlayer resources, making it available */
  public async start(): Promise<void> {
    await this.plug.start();
  }
  /** Stop the Plug and the underlayer resources, making it unavailable */
  public async stop(): Promise<void> {
    await this.plug.stop();
  }
}
