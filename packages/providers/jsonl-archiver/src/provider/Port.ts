/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Layer } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { LoggerInstance } from '@mdf.js/logger';
import { FileStats } from '../Client';
import { CONFIG_PROVIDER_BASE_NAME } from '../config';
import { Client, Config } from './types';

export class Port extends Layer.Provider.Port<Client, Config> {
  /** Last health state of the port instance */
  private lastHealthState: 'healthy' | 'unhealthy';
  /** Configuration loader handler */
  private readonly instance: Client;
  /**
   * Implementation of functionalities of an Jsonl File Store port instance.
   * @param config - Port configuration options
   * @param logger - Port logger, to be used internally
   * @param name - Port name, to be used internally
   */
  constructor(config: Config, logger: LoggerInstance, name?: string) {
    super(config, logger, name ?? CONFIG_PROVIDER_BASE_NAME);
    this.instance = new Client({ ...this.config, logger: this.logger });
    this.logger.debug(`New instance of Jsonl File Store port created: ${this.uuid}`);
    this.lastHealthState = 'healthy';
  }
  /** Return the underlying port instance */
  public get client(): Client {
    return this.instance;
  }
  /** Return the port state as a boolean value, true if the port is available, false in otherwise */
  public get state(): boolean {
    return this.instance.hasErrors();
  }
  /** Initialize the port instance */
  public async start(): Promise<void> {
    this.logger.info(`Starting JSONL archiver port instance: ${this.uuid}`);
    this.eventsWrapping(this.instance);
    this.instance.start();
  }
  /** Stop the port instance */
  public async stop(): Promise<void> {
    this.logger.info(`Stopping JSONL archiver port instance: ${this.uuid}`);
    this.instance.stop();
    this.eventsUnwrapping(this.instance);
  }
  /** Close the port instance */
  public async close(): Promise<void> {
    return this.stop();
  }
  /** Handle the error event from the port instance */
  private onErrorHandler = (error: Crash): void => {
    this.updateStats();
    this.logger.debug(`Error in JSONL archiver port instance: ${this.uuid} - ${error.message}`);
    this.emit('error', error);
  };
  /** Handle the resolve event from the port instance */
  private onResolveHandler = (stats: FileStats): void => {
    this.updateStats();
    this.logger.debug(`Resolved file stats in JSONL archiver port instance: ${this.uuid}`);
  };
  /** Handle the rotate event from the port instance */
  private onRotateHandler = (stats: FileStats): void => {
    this.updateStats();
    this.logger.debug(`Rotation in JSONL archiver port instance: ${this.uuid}`);
  };
  /** Handle the handlerCleaned event from the port instance */
  private onHandlerCleanedHandler = (): void => {
    this.updateStats();
    this.logger.debug(`Handler cleaned in JSONL archiver port instance: ${this.uuid}`);
  };
  /** Update the statistics of the port instance */
  private updateStats(): void {
    this.addCheck('statistics', {
      componentId: this.uuid,
      observedValue: this.instance.stats,
      observedUnit: 'statistics',
      status: this.instance.hasErrors() ? 'fail' : 'pass',
      output: undefined,
      time: new Date().toISOString(),
    });
    const shouldEmitHealthy = !this.instance.hasErrors() && this.lastHealthState === 'unhealthy';
    const shouldEmitUnhealthy = this.instance.hasErrors() && this.lastHealthState === 'healthy';
    if (shouldEmitUnhealthy) {
      this.lastHealthState = 'unhealthy';
      this.emit(
        'unhealthy',
        new Crash(`There are errors in the JSONL archiver port instance: ${this.uuid}`)
      );
    } else if (shouldEmitHealthy) {
      this.lastHealthState = 'healthy';
      this.emit('healthy');
    }
  }
  /**
   * Attach all the events and log for debugging
   * @param instance - client where the event managers will be attached
   */
  private eventsWrapping(instance: Client): Client {
    instance.on('error', this.onErrorHandler);
    instance.on('resolve', this.onResolveHandler);
    instance.on('rotate', this.onRotateHandler);
    instance.on('handlerCleaned', this.onHandlerCleanedHandler);
    return instance;
  }
  /**
   * Remove all the events listeners
   * @param instance - client where the event managers will be unattached
   */
  private eventsUnwrapping(instance: Client): Client {
    instance.off('error', this.onErrorHandler);
    instance.off('resolve', this.onResolveHandler);
    instance.off('rotate', this.onRotateHandler);
    instance.off('handlerCleaned', this.onHandlerCleanedHandler);
    return instance;
  }
}
