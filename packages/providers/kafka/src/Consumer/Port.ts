/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Crash } from '@mdf.js/crash';
import { LoggerInstance, Provider } from '@mdf.js/provider';
import { Consumer, SystemStatus } from '../Client';
import { CONFIG_PROVIDER_BASE_NAME } from './config';
import { Config, Consumer as KafkaConsumer } from './types';

export class Port extends Provider.Port<KafkaConsumer, Config> {
  /** Consumer connection handler */
  private readonly instance: Consumer;
  /**
   * Implementation of functionalities of an Elastic port instance.
   * @param config - Port configuration options
   * @param logger - Port logger, to be used internally
   */
  constructor(config: Config, logger: LoggerInstance) {
    super(config, logger, config.client.clientId ?? CONFIG_PROVIDER_BASE_NAME);
    this.instance = new Consumer(config.client, config.consumer);
    // Stryker disable next-line all
    this.logger.debug(`New instance of Kafka Consumer port created: ${this.uuid}`);
  }
  /** Return the underlying port instance */
  public get client(): KafkaConsumer {
    return this.instance.consumer;
  }
  /** Return the port state as a boolean value, true if the port is available, false in otherwise */
  public get state(): boolean {
    return this.instance.state;
  }
  /** Initialize the port instance */
  public async start(): Promise<void> {
    await this.instance.start();
    this.eventsWrapping(this.instance);
  }
  /** Stop the port instance */
  public async stop(): Promise<void> {
    await this.instance.stop();
    this.eventsUnWrapping(this.instance);
  }
  /** Close the port instance */
  public async close(): Promise<void> {
    await this.stop();
  }
  /** Handler for the healthy event */
  private readonly onHealthyEvent = (status: SystemStatus): void => {
    this.addCheck('topics', {
      componentId: this.uuid,
      observedValue: status,
      observedUnit: 'topics',
      status: 'pass',
      output: undefined,
      time: new Date().toISOString(),
    });
    this.emit('healthy');
  };
  /**
   * Handler for the unhealthy event
   * @param error - Error instance
   */
  private readonly onUnhealthyEvent = (error: Crash): void => {
    this.addCheck('topics', {
      componentId: this.uuid,
      observedValue: {},
      observedUnit: 'topics',
      status: 'fail',
      output: error.message,
      time: new Date().toISOString(),
    });
    this.emit('unhealthy', error);
  };
  /**
   * Attach all the events and log for debugging
   * @param instance - AMQP Receiver client instance
   */
  private eventsWrapping(instance: Consumer): Consumer {
    instance.on('healthy', this.onHealthyEvent);
    instance.on('unhealthy', this.onUnhealthyEvent);
    return instance;
  }
  /**
   * Attach all the events and log for debugging
   * @param instance - AMQP Receiver client instance
   */
  private eventsUnWrapping(instance: Consumer): Consumer {
    instance.off('healthy', this.onHealthyEvent);
    instance.off('unhealthy', this.onUnhealthyEvent);
    return instance;
  }
}
