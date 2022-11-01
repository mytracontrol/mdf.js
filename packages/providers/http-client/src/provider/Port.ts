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
import { LoggerInstance, Provider } from '@mdf/provider';
import axios from 'axios';
import { Agent as HTTPAgent } from 'http';
import { Agent as HTTPSAgent } from 'https';
import { CONFIG_PROVIDER_BASE_NAME } from '../config';
import { Client, Config } from './types';
export class Port extends Provider.Port<Client, Config> {
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
    this.emit('ready');
  }
  /** Stop the port instance */
  public async stop(): Promise<void> {
    this.emit('closed');
  }
  /** Close the port instance */
  public async close(): Promise<void> {
    await this.stop();
  }
}
