/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Layer } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { LoggerInstance } from '@mdf.js/logger';
import { Consumer, Producer, SystemStatus } from '../Client';
import { CONFIG_PROVIDER_BASE_NAME } from './config';
import { BaseConfig } from './types';

export abstract class BasePort<Client, Config extends BaseConfig> extends Layer.Provider.Port<
  Client,
  Config
> {
  /** Flag to check if the port is already started */
  private started = false;
  /**
   * Implementation of functionalities of an Elastic port instance.
   * @param config - Port configuration options
   * @param logger - Port logger, to be used internally
   * @param instance - Consumer/Producer instance
   */
  constructor(
    config: Config,
    logger: LoggerInstance,
    private readonly instance: Consumer | Producer
  ) {
    super(config, logger, config.client.clientId ?? CONFIG_PROVIDER_BASE_NAME);
    this.instance.on('status', this.onStatusEvent);
    this.instance.on('error', this.onErrorEvent);
    // Stryker disable next-line all
    this.logger.debug(`New instance of Kafka Consumer port created: ${this.uuid}`);
    this.started = false;
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
    if (this.started) {
      return;
    }
    try {
      await this.instance.start();
      this.eventsWrapping(this.instance);
      this.started = true;
    } catch (error) {
      const cause = Crash.from(error, this.uuid);
      throw new Crash(`Error in port initialization: ${cause.message}`, this.uuid, {
        cause,
      });
    }
  }
  /** Stop the port instance */
  public async stop(): Promise<void> {
    if (!this.started) {
      return;
    }
    try {
      this.eventsUnWrapping(this.instance);
      await this.instance.stop();
      this.started = false;
    } catch (error) {
      const cause = Crash.from(error, this.uuid);
      throw new Crash(`Error in port disconnection: ${cause.message}`, this.uuid, {
        cause,
      });
    }
  }
  /** Close the port instance */
  public async close(): Promise<void> {
    await this.stop();
  }
  /** Handler for the status event */
  private readonly onStatusEvent = (status?: SystemStatus): void => {
    this.addCheck('topics', {
      componentId: this.uuid,
      observedValue: status,
      observedUnit: 'topics',
      status: status ? 'pass' : 'fail',
      output: status ? undefined : 'No topics available',
      time: new Date().toISOString(),
    });
  };
  /**
   * Handler for the unhealthy event
   * @param error - Error instance
   */
  private readonly onUnhealthyEvent = (error: Crash): void => {
    this.emit('unhealthy', error);
  };
  /**
   * Handler for the healthy event
   * @param error - Error instance
   */
  private readonly onHealthyEvent = (): void => {
    this.emit('healthy');
  };
  /**
   * Handler for the error event
   * @param error - Error instance
   */
  private readonly onErrorEvent = (error: Crash): void => {
    this.emit('error', error);
  };
  /**
   * Attach all the events and log for debugging
   * @param instance - Kafka Consumer/Producer client instance
   */
  private eventsWrapping(instance: Consumer | Producer): Consumer | Producer {
    instance.on('healthy', this.onHealthyEvent);
    instance.on('unhealthy', this.onUnhealthyEvent);
    return instance;
  }
  /**
   * Attach all the events and log for debugging
   * @param instance - Kafka Consumer/Producer client instance
   */
  private eventsUnWrapping(instance: Consumer | Producer): Consumer | Producer {
    instance.off('healthy', this.onHealthyEvent);
    instance.off('unhealthy', this.onUnhealthyEvent);
    return instance;
  }
}
