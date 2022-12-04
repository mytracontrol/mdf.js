/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { LoggerInstance, Provider } from '@mdf.js/provider';
import { CONFIG_PROVIDER_BASE_NAME } from '../config';
import { Client, Config } from './types';

export class Port extends Provider.Port<Client, Config> {
  /** Elasticsearch connection handler */
  private readonly instance: Client;
  /**
   * Implementation of functionalities of an Elastic port instance.
   * @param config - Port configuration options
   * @param logger - Port logger, to be used internally
   */
  constructor(config: Config, logger: LoggerInstance) {
    super(
      config,
      logger,
      typeof config.name === 'string' ? config.name : CONFIG_PROVIDER_BASE_NAME
    );
    this.instance = new Client(this.config);
    // Stryker disable next-line all
    this.logger.debug(`New instance of Config port created: ${this.uuid}`);
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
    this.emit('unhealthy', this.instance.error);
  };
}
