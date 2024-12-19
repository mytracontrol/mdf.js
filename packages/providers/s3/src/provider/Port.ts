/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Layer } from '@mdf.js/core';
import { LoggerInstance } from '@mdf.js/logger';
import { CONFIG_PROVIDER_BASE_NAME } from '../config';
import { Client, Config } from './types';

export class Port extends Layer.Provider.Port<Client, Config> {
  /** S3 connection handler */
  private readonly instance: Client;
  /** Connection flag */
  private connected: boolean;

  /**
   * Implementation of functionalities of a S3 port instance.
   * @param config - Port configuration options
   * @param logger - Port logger, to be used internally
   */
  constructor(config: Config, logger: LoggerInstance) {
    super(config, logger, config.serviceId || CONFIG_PROVIDER_BASE_NAME);
    this.logger.silly(
      `config: ${JSON.stringify({ ...config, credentials: { accessKeyId: '***', secretAccess: '***' } })}`
    );
    this.instance = new Client(config);
    // Stryker disable next-line all
    this.logger.debug(`New instance of S3 port created: ${this.uuid}`, this.uuid, this.name);
    this.connected = false;
  }
  /** Return the underlying port instance */
  public get client(): Client {
    return this.instance;
  }
  /** Return the port state as a boolean value, true if the port is available, false in otherwise */
  public get state(): boolean {
    return this.connected;
  }
  /** Start the port, making it available */
  public async start(): Promise<void> {
    if (!this.connected) {
      this.connected = true;
    }
    return Promise.resolve();
  }
  /** Stop the port, making it unavailable */
  public async stop(): Promise<void> {
    if (this.connected) {
      this.instance.destroy();
      this.connected = false;
    }
    return Promise.resolve();
  }
  /** Close the port, alias to stop */
  public async close(): Promise<void> {
    await this.stop();
  }
}
