/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Layer } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { LoggerInstance } from '@mdf.js/logger';
import { CONFIG_PROVIDER_BASE_NAME } from '../config';
import { Client, Config } from './types';

export class Port extends Layer.Provider.Port<Client, Config> {
  /** Last health state of the port instance */
  private lastHealthState: 'healthy' | 'unhealthy' | undefined;
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
    this.instance = new Client(this.name, this.config, this.logger);
    this.logger.debug(`New instance of Jsonl File Store port created: ${this.uuid}`);
  }
  /** Return the underlying port instance */
  public get client(): Client {
    return this.instance;
  }
  /** Return the port state as a boolean value, true if the port is available, false in otherwise */
  public get state(): boolean {
    return this.instance.isErrored;
  }
  /** Initialize the port instance */
  public async start(): Promise<void> {
    this.instance.on('error', this.onError);
    this.instance.on('success', this.onSuccess);
    this.instance.start();
  }
  /** Stop the port instance */
  public async stop(): Promise<void> {
    this.logger.info(`Stopping jsonl-file-store port instance`);
    this.instance.stop();
    this.instance.off('error', this.onError);
    this.instance.off('success', this.onSuccess);
  }
  /** Close the port instance */
  public async close(): Promise<void> {
    return this.stop();
  }

  /** Handle the error event from the port instance */
  private onError = (error: Crash): void => {
    this.logger.info(`Jsonl-file-store port instance is unhealthy`);
    this.addCheck('statistics', {
      componentId: this.uuid,
      observedValue: this.instance.filesStats,
      observedUnit: 'statistics',
      status: 'fail',
      output: error.message,
      time: new Date().toISOString(),
    });
    this.lastHealthState = 'unhealthy';
    this.emit('unhealthy', error);
  };

  /** Handle the success event from the port instance */
  private onSuccess = (): void => {
    this.addCheck('statistics', {
      componentId: this.uuid,
      observedValue: this.instance.filesStats,
      observedUnit: 'statistics',
      status: 'pass',
      output: undefined,
      time: new Date().toISOString(),
    });
    if (this.lastHealthState !== 'healthy') {
      this.logger.info(`Jsonl-file-store port instance is now healthy`);
      this.lastHealthState = 'healthy';
      this.emit('healthy');
    }
  };
}
