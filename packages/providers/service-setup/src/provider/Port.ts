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

export class Port<T extends Record<string, any> = Record<string, any>> extends Layer.Provider.Port<
  Client<T>,
  Config<T>
> {
  /** Configuration loader handler */
  private readonly instance: Client<T>;
  /**
   * Implementation of functionalities of an Elastic port instance.
   * @param config - Port configuration options
   * @param logger - Port logger, to be used internally
   * @param name - Port name, to be used internally
   */
  constructor(config: Config<T>, logger: LoggerInstance, name?: string) {
    super(config, logger, name ?? CONFIG_PROVIDER_BASE_NAME);
    this.instance = new Client<T>(this.name, this.config, this.logger);
    // Stryker disable next-line all
    this.logger.debug(`New instance of Config port created: ${this.uuid}`);
  }
  /** Return the underlying port instance */
  public get client(): Client<T> {
    return this.instance;
  }
  /** Return the port state as a boolean value, true if the port is available, false in otherwise */
  public get state(): boolean {
    return this.instance.isErrored;
  }
  /** Initialize the port instance */
  public async start(): Promise<void> {
    if (this.instance.isErrored) {
      process.nextTick(this.emitUnhealthy);
    }
  }
  /** Stop the port instance */
  public async stop(): Promise<void> {
    return;
  }
  /** Close the port instance */
  public async close(): Promise<void> {
    return this.stop();
  }
  /** Emit unhealthy state */
  private readonly emitUnhealthy = (): void => {
    if (this.instance.error) {
      this.emit('unhealthy', this.instance.error);
    } else {
      this.emit(
        'unhealthy',
        new Crash('An error was reposted by the port instance, but is not registered')
      );
    }
  };
}
