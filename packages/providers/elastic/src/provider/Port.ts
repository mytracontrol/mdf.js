/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Crash } from '@mdf.js/crash';
import { LoggerInstance, Provider } from '@mdf.js/provider';
import { CONFIG_PROVIDER_BASE_NAME } from '../config';
import { Status } from './Status.t';
import { Client, Config } from './types';

export class Port extends Provider.Port<Client, Config> {
  /** Elasticsearch connection handler */
  private readonly instance: Client;
  /** Ping interval */
  private timeInterval?: NodeJS.Timeout;
  /** Time out for ping/health request */
  private readonly interval: number;
  /** Is the first check */
  private isFirstCheck: boolean;
  /** Client connection state */
  private healthy: boolean;
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
    this.logger.debug(`New instance of Redis port created: ${this.uuid}`);
    this.interval = this.config.pingTimeout as number;
    this.healthy = false;
    this.isFirstCheck = true;
  }
  /** Return the underlying port instance */
  public get client(): Client {
    return this.instance;
  }
  /** Return the port state as a boolean value, true if the port is available, false in otherwise */
  public get state(): boolean {
    return this.healthy;
  }
  /** Initialize the port instance */
  public async start(): Promise<void> {
    if (!this.timeInterval) {
      this.timeInterval = setInterval(this.statusCheck, this.interval);
      this.statusCheck();
    }
  }
  /** Stop the port instance */
  public async stop(): Promise<void> {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
      this.timeInterval = undefined;
    }
  }
  /** Close the port instance */
  public async close(): Promise<void> {
    await this.stop();
    await this.instance.close();
    this.emit('closed');
  }
  /** Check the health of the system */
  private readonly statusCheck = () => {
    // Stryker disable next-line all
    this.logger.debug(`Pinging to the system`, this.uuid, this.name);
    const requestTimeout = Math.floor(this.interval * 0.9);
    this.instance.cat
      .health({ format: 'json' }, { requestTimeout })
      .then((result: { [key: string]: any }) => {
        // Stryker disable next-line all
        this.logger.debug(`Health success`, this.uuid, this.name);
        this.evaluateStats(result['body']);
      })
      .catch(rawError => {
        const error = Crash.from(rawError);
        this.emit(
          'error',
          new Crash(`Error performing status check of elastic instance`, this.uuid, {
            cause: error,
          })
        );
      });
  };
  /**
   * Check the results and emit the healthy or unhealthy event
   * @param result - The result of the status check
   * @returns
   */
  private evaluateStats(result: Status): Status {
    let message: string | undefined = undefined;
    let hasError = false;
    const observedValue: Status = result;
    const someServerWithError = result.some(entry => entry.status === 'red');
    if (someServerWithError) {
      message = `At least one of the nodes in the system is red state`;
      hasError = true;
    }
    this.addCheck('nodes', {
      componentId: this.uuid,
      observedValue,
      observedUnit: 'Nodes Health',
      status: hasError ? 'fail' : 'pass',
      output: message,
      time: new Date().toISOString(),
    });
    if (hasError && (this.healthy || this.isFirstCheck)) {
      this.emit('unhealthy', new Crash(message || 'Unexpected error in the evaluation', this.uuid));
      this.healthy = false;
    } else if (!this.healthy) {
      this.emit('ready');
      this.emit('healthy');
      this.healthy = true;
    }
    this.isFirstCheck = false;
    return result;
  }
}
