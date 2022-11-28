/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health } from '@mdf.js/core';
import { Crash, Multi } from '@mdf.js/crash';
import { overallStatus } from '@mdf.js/utils';
import { merge } from 'lodash';
import { Readable, Writable } from 'stream';
import { Plugs, SinkOptions } from '../../types';
import { PlugWrapper } from './PlugWrapper';

import { DebugLogger, LoggerInstance, SetContext } from '@mdf.js/logger';
import { DEFAULT_WRITABLE_OPTIONS } from './const';

export declare interface Base<
  T extends Plugs.Sink.Any<Type, Data, CustomHeaders>,
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, any> = Record<string, any>
> {
  /** Emitted when the stream have been closed */
  on(event: 'close', listener: () => void): this;
  /** Emitted when it is appropriate to resume writing data to the stream */
  on(event: 'drain', listener: () => void): this;
  /** Due to the implementation of consumer classes, this event will never emitted */
  on(event: 'error', listener: (error: Crash | Error) => void): this;
  /**
   * Emitted after the stream.end() method has been called, and all data has been flushed to the
   * underlying system
   */
  on(event: 'finish', listener: () => void): this;
  /**
   * Emitted when the stream.pipe() method is called on a readable stream, adding this writable to
   * its set of destinations
   */
  on(event: 'pipe', listener: (src: Readable) => void): this;
  /**
   * Emitted when the stream.unpipe() method is called on a Readable stream, removing this Writable
   * from its set of destinations
   */
  on(event: 'unpipe', listener: (src: Readable) => void): this;
  /**
   * Emitted when a unpipe event is received to inform upper firehose manager about the sink that
   * have been unpipe
   */
  on(event: 'lost', listener: (src: Writable) => void): this;
  /** Emitted on every state change */
  on(event: 'status', listener: (status: Health.API.Status) => void): this;
}

/** Firehose sink (Writable) plug class */
export abstract class Base<
    T extends Plugs.Sink.Any<Type, Data, CustomHeaders>,
    Type extends string = string,
    Data = any,
    CustomHeaders extends Record<string, any> = Record<string, any>
  >
  extends Writable
  implements Health.Component
{
  /** Debug logger for development and deep troubleshooting */
  protected readonly logger: LoggerInstance;
  /** Store the last error detected in the stream */
  protected error?: Multi | Crash;
  /** Flag to indicate that an unhealthy status has been emitted recently */
  private lastStatusEmitted?: Health.API.Status;
  /** Wrapped source plug */
  public readonly plugWrapper: PlugWrapper<Type, Data, CustomHeaders>;
  /**
   * Create a new instance for a firehose sink
   * @param plug - sink plug instance
   * @param options - sink options
   */
  constructor(protected readonly plug: T, options?: SinkOptions) {
    super(merge(DEFAULT_WRITABLE_OPTIONS, options?.writableOptions));
    // Stryker disable next-line all
    this.logger = SetContext(
      options?.logger || new DebugLogger(`mdf:stream:sink:${this.plug.name}`),
      'Sink',
      this.plug.componentId
    );
    this.plugWrapper = new PlugWrapper(this.plug, options?.retryOptions);
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
          observedValue: `${this.writableLength}/${this.writableHighWaterMark}`,
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
    if (!this.writable) {
      return 'fail';
    } else if (this.writableLength >= this.writableHighWaterMark) {
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
    this.logger.error(`Error in sink stream ${this.name}: ${this.error.message}`);
    this.emitStatus();
  };
  /** Plug status event handler */
  private readonly onStatusEvent = () => {
    this.emitStatus();
  };
  /** Super pipe event handler */
  private readonly onPipeEvent = () => {
    // Stryker disable next-line all
    this.logger.debug(`Sink stream ${this.plug.name} has been piped`);
    this.emitStatus();
  };
  /** Super unpipe event handler */
  private readonly onUnpipeEvent = () => {
    // Stryker disable next-line all
    this.logger.debug(`Sink stream ${this.plug.name} has been unpiped`);
    this.emitStatus();
    this.emit('lost', this);
  };
  /** Super drain event handler */
  private readonly onDrainEvent = () => {
    // Stryker disable next-line all
    this.logger.debug(`Sink stream ${this.plug.name} has been drained`);
    this.emitStatus();
  };
  /** Super close event handler */
  private readonly onCloseEvent = () => {
    // Stryker disable next-line all
    this.logger.info(`Sink stream ${this.plug.name} has been closed`);
    this.emitStatus();
  };
  /**
   * Wrap super and plug events in the same to aggregate them in one component
   * @param plug - sink plug instance
   */
  private wrappingEvents(plug: Plugs.Sink.Any<Type, Data, CustomHeaders>): void {
    super.on('error', this.onErrorEvent);
    super.on('unpipe', this.onUnpipeEvent);
    super.on('pipe', this.onPipeEvent);
    super.on('drain', this.onDrainEvent);
    super.on('close', this.onCloseEvent);
    plug.on('error', this.onErrorEvent);
    plug.on('status', this.onStatusEvent);
  }
  /** Start the Plug and the underlayer resources, making it available */
  public async start(): Promise<void> {
    await this.plug.start();
  }
  /** Stop the Plug and the underlayer resources, making it unavailable */
  public async stop(): Promise<void> {
    await this.plug.stop();
  }
}
