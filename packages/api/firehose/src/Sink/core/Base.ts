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

import { Health } from '@mdf.js/core';
import { Crash, Multi } from '@mdf.js/crash';
import { overallStatus, RetryOptions } from '@mdf.js/utils';
import Debug, { Debugger } from 'debug';
import { merge } from 'lodash';
import { Readable, Writable, WritableOptions } from 'stream';
import { Plugs } from '../../types';
import { PlugWrapper } from './PlugWrapper';

import { DEFAULT_WRITABLE_OPTIONS } from './const';

export declare interface Base<T extends Plugs.Sink.Any> {
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
export abstract class Base<T extends Plugs.Sink.Any> extends Writable implements Health.Component {
  /** Debug logger for development and deep troubleshooting */
  protected readonly logger: Debugger;
  /** Store the last error detected in the stream */
  protected error?: Multi | Crash;
  /** Flag to indicate that an unhealthy status has been emitted recently */
  private lastStatusEmitted?: Health.API.Status;
  /** Wrapped source plug */
  private plugWrapper: PlugWrapper;
  /**
   * Create a new instance for a firehose sink
   * @param plug - sink plug instance
   * @param retryOptions - options for job retry operations
   * @param options - writable streams options
   */
  constructor(
    protected readonly plug: T,
    private readonly retryOptions?: RetryOptions,
    options?: WritableOptions
  ) {
    super(merge(DEFAULT_WRITABLE_OPTIONS, options));
    // Stryker disable next-line all
    this.logger = Debug(`mdf:stream:sink:${this.plug.name}`);
    this.plugWrapper = new PlugWrapper(this.plug, this.retryOptions);
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
  private onErrorEvent = (rawError: Error | Crash) => {
    this.error = Crash.from(rawError, this.componentId);
    // Stryker disable next-line all
    this.logger(`Error in sink stream ${this.name}: ${this.error.message}`);
    this.emitStatus();
  };
  /** Plug status event handler */
  private onStatusEvent = () => {
    this.emitStatus();
  };
  /** Super pipe event handler */
  private onPipeEvent = () => {
    // Stryker disable next-line all
    this.logger.extend('debug')(`Sink stream ${this.plug.name} has been piped`);
    this.emitStatus();
  };
  /** Super unpipe event handler */
  private onUnpipeEvent = () => {
    // Stryker disable next-line all
    this.logger.extend('debug')(`Sink stream ${this.plug.name} has been unpiped`);
    this.emitStatus();
    this.emit('lost', this);
  };
  /** Super drain event handler */
  private onDrainEvent = () => {
    // Stryker disable next-line all
    this.logger.extend('debug')(`Sink stream ${this.plug.name} has been drained`);
    this.emitStatus();
  };
  /** Super close event handler */
  private onCloseEvent = () => {
    // Stryker disable next-line all
    this.logger(`Sink stream ${this.plug.name} has been closed`);
    this.emitStatus();
  };
  /** Wrap super and plug events in the same to aggregate them in one component */
  private wrappingEvents(plug: Plugs.Sink.Any): void {
    super.on('error', this.onErrorEvent);
    super.on('unpipe', this.onUnpipeEvent);
    super.on('pipe', this.onPipeEvent);
    super.on('drain', this.onDrainEvent);
    super.on('close', this.onCloseEvent);
    plug.on('error', this.onErrorEvent);
    plug.on('status', this.onStatusEvent);
  }
}
