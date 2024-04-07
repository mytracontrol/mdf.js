/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Layer } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { LoggerInstance } from '@mdf.js/logger';
import { Receiver, Sender } from '../Client';
import { CONFIG_PROVIDER_BASE_NAME } from './config';
import { Config } from './types';

const DEFAULT_CHECK_CREDIT_INTERVAL = 10000;

export class BasePort<Client> extends Layer.Provider.Port<Client, Config> {
  /** Credit check interval */
  private timeInterval?: NodeJS.Timeout;
  /** Time out for credits check interval */
  private readonly interval: number;
  /**
   * Implementation of functionalities of an AMQP Sender port instance.
   * @param config - Port configuration options
   * @param logger - Port logger, to be used internally
   * @param instance - Sender/Receiver instance
   */
  constructor(
    config: Config,
    logger: LoggerInstance,
    private readonly instance: Sender | Receiver
  ) {
    super(config, logger, config.receiver_options?.name ?? CONFIG_PROVIDER_BASE_NAME);
    this.interval = DEFAULT_CHECK_CREDIT_INTERVAL;
    // Stryker disable next-line all
    this.logger.debug(`New instance of AMQP Receiver port created: ${this.uuid}`);
  }
  /** Return the underlying port instance */
  public get client(): Client {
    return this.instance.client as Client;
  }
  /** Return the port state as a boolean value, true if the port is available, false in otherwise */
  public get state(): boolean {
    return this.instance.state;
  }
  /** Initialize the port instance */
  public async start(): Promise<void> {
    await this.instance.start();
    this.eventsWrapping(this.instance);
    this.checkQueue();
    if (!this.timeInterval) {
      this.timeInterval = setInterval(this.checkQueue, this.interval);
    }
  }
  /** Stop the port instance */
  public async stop(): Promise<void> {
    await this.instance.stop();
    this.eventsUnWrapping(this.instance);
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
      this.timeInterval = undefined;
    }
  }
  /** Close the port instance */
  public async close(): Promise<void> {
    await this.stop();
  }
  /**
   * Handler for the error event
   * @param error - Error instance
   */
  private readonly onErrorEvent = (error: Crash): void => {
    this.emit('error', error);
  };
  /**
   * Handler for the closed event
   * @param error - Error instance
   */
  private readonly onClosedEvent = (error: Crash): void => {
    this.emit('closed', error);
  };
  /** Handler for the healthy event */
  private readonly onHealthyEvent = (): void => {
    this.emit('healthy');
  };
  /**
   * Handler for the unhealthy event
   * @param error - Error instance
   */
  private readonly onUnhealthyEvent = (error: Crash): void => {
    this.emit('unhealthy', error);
    this.checkQueue();
  };
  /** Handler for the message event */
  private readonly checkQueue = (): void => {
    this.addCheck('credits', {
      componentId: this.uuid,
      observedValue: this.instance.client.credit,
      observedUnit: 'credits',
      status: this.instance.client.credit ? 'pass' : 'warn',
      output: this.instance.client.credit ? undefined : 'No credits available',
      time: new Date().toISOString(),
    });
  };
  /**
   * Attach all the events and log for debugging
   * @param instance - AMQP Receiver client instance
   */
  private eventsWrapping(instance: Sender | Receiver): Sender | Receiver {
    instance.on('error', this.onErrorEvent);
    instance.on('healthy', this.onHealthyEvent);
    instance.on('unhealthy', this.onUnhealthyEvent);
    instance.on('closed', this.onClosedEvent);
    return instance;
  }
  /**
   * Attach all the events and log for debugging
   * @param instance - AMQP Receiver client instance
   */
  private eventsUnWrapping(instance: Sender | Receiver): Sender | Receiver {
    instance.off('error', this.onErrorEvent);
    instance.off('healthy', this.onHealthyEvent);
    instance.off('unhealthy', this.onUnhealthyEvent);
    instance.off('closed', this.onClosedEvent);
    return instance;
  }
}
