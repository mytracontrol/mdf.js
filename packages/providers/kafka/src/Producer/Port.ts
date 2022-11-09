/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Crash } from '@mdf.js/crash';
import { LoggerInstance, Provider } from '@mdf.js/provider';
import { Producer, SystemStatus } from '../Client';
import { CONFIG_PROVIDER_BASE_NAME } from './config';
import { Config, Producer as KafkaProducer } from './types';

export class Port extends Provider.Port<KafkaProducer, Config> {
  /** Producer connection handler */
  private readonly instance: Producer;
  /**
   * Implementation of functionalities of an Kafka Producer port instance.
   * @param config - Port configuration options
   * @param logger - Port logger, to be used internally
   */
  constructor(config: Config, logger: LoggerInstance) {
    super(config, logger, config.client.clientId ?? CONFIG_PROVIDER_BASE_NAME);
    this.instance = new Producer(config.client, config.producer);
    // Stryker disable next-line all
    this.logger.debug(`New instance of Kafka Producer port created: ${this.uuid}`);
  }
  /** Return the underlying port instance */
  public get client(): KafkaProducer {
    return this.instance.producer;
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
  private eventsWrapping(instance: Producer): Producer {
    instance.on('healthy', this.onHealthyEvent);
    instance.on('unhealthy', this.onUnhealthyEvent);
    return instance;
  }
  /**
   * Attach all the events and log for debugging
   * @param instance - AMQP Receiver client instance
   */
  private eventsUnWrapping(instance: Producer): Producer {
    instance.off('healthy', this.onHealthyEvent);
    instance.off('unhealthy', this.onUnhealthyEvent);
    return instance;
  }
}
