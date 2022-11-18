/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import {
  Consumer as KafkaConsumer,
  ConsumerConfig,
  ConsumerCrashEvent,
  KafkaConfig,
  KafkaJSNonRetriableError,
} from 'kafkajs';
import { get } from 'lodash';
import { Client } from './Client';

export class Consumer extends Client {
  /** Kafka Consumer */
  private readonly consumer: KafkaConsumer;
  /** Kafka Consumer configuration options */
  readonly consumerOptions: ConsumerConfig;
  /**
   * Creates an instance of KafkaConsumer
   * @param clientOptions - Kafka client configuration options
   * @param consumerOptions - Kafka consumer configuration options
   * @param interval - Period of health check interval
   */
  constructor(clientOptions: KafkaConfig, consumerOptions: ConsumerConfig, interval?: number) {
    super(clientOptions, interval);
    this.consumerOptions = {
      ...consumerOptions,
      retry: consumerOptions.retry ?? { restartOnFailure: this.onFailure },
    };
    this.consumer = this.instance.consumer(this.consumerOptions);
  }
  /** Kafka consumer */
  public get client(): KafkaConsumer {
    return this.consumer;
  }
  /** Perform the connection of the instance to the system */
  public override async start(): Promise<void> {
    try {
      await super.start();
      await this.consumer.connect();
      for (const event of Object.values(this.consumer.events)) {
        this.consumer.on(event, this.eventLogging);
      }
      this.consumer.on('consumer.crash', this.onCrashEvent);
    } catch (error) {
      const cause = Crash.from(error, this.componentId);
      throw new Crash(`Error in initial connection process: ${cause.message}`, this.componentId, {
        cause,
      });
    }
  }
  /** Perform the disconnection of the instance from the system */
  public override async stop(): Promise<void> {
    try {
      await super.stop();
      await this.consumer.disconnect();
    } catch (error) {
      const cause = Crash.from(error, this.componentId);
      throw new Crash(`Error in disconnection process: ${cause.message}`, this.componentId, {
        cause,
      });
    }
  }
  /**
   * Manage error events from KafkaJS library
   * @param context - event context
   */
  private readonly onCrashEvent = (context: ConsumerCrashEvent): void => {
    // Stryker disable next-line all
    this.logger.error(`Kafka error in consumer interface`);
    const cause = get(context, 'payload.error', new Crash('Unknown error', this.componentId));
    const message =
      cause instanceof KafkaJSNonRetriableError
        ? `No fixable error in Kafka interface: ${cause.message}`
        : `Fixable error in Kafka interface: ${cause.message}`;
    this.emit('error', new Crash(message, this.componentId, { cause }));
  };
}
