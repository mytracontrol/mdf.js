/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Layer } from '@mdf.js/core';
import { LoggerInstance } from '@mdf.js/logger';
import axios from 'axios';
import { Agent as HTTPAgent } from 'http';
import { Agent as HTTPSAgent } from 'https';
import { CONFIG_PROVIDER_BASE_NAME } from '../config';
import { Client, Config } from './types';
export class Port extends Layer.Provider.Port<Client, Config> {
  /** Client handler */
  private readonly instance: Client;
  /**
   * Implementation of functionalities of an HTTP client port instance.
   * @param config - Port configuration options
   * @param logger - Port logger, to be used internally
   */
  constructor(config: Config, logger: LoggerInstance) {
    super(config, logger, CONFIG_PROVIDER_BASE_NAME);
    this.instance = axios.create(config.requestConfig);
    if (config.httpAgentOptions) {
      this.instance.defaults.httpAgent = new HTTPAgent(config.httpAgentOptions);
    }
    if (config.httpAgentOptions) {
      this.instance.defaults.httpsAgent = new HTTPSAgent(config.httpAgentOptions);
    }
    // Stryker disable next-line all
    this.logger.debug(`New instance of HTTP Client port: ${this.uuid}`, this.uuid, this.name);
  }
  /** Return the underlying port instance */
  public get client(): Client {
    return this.instance;
  }
  /** Return the port state as a boolean value, true if the port is available, false in otherwise */
  public get state(): boolean {
    return true;
  }
  /** Initialize the port instance */
  public async start(): Promise<void> {
    // Stryker disable next-line all
    this.logger.debug(`Starting HTTP Client port: ${this.uuid}`);
    return;
  }
  /** Stop the port instance */
  public async stop(): Promise<void> {
    // Stryker disable next-line all
    this.logger.debug(`Stopping HTTP Client port: ${this.uuid}`);
    return;
  }
  /** Close the port instance */
  public async close(): Promise<void> {
    await this.stop();
    return;
  }
}
