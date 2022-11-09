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
import { Client } from './Client';

export class Consumer extends Client {
  /** Kafka Consumer */
  private readonly _consumer: KafkaConsumer;
  /** Kafka Consumer configuration options */
  readonly consumerOptions: ConsumerConfig;
  /**
   * Creates an instance of KafkaConsumer
   * @param clientOptions - Kafka client configuration options
   * @param consumerOptions - Kafka consumer configuration options
   */
  constructor(clientOptions: KafkaConfig, consumerOptions: ConsumerConfig) {
    super(clientOptions);
    this.consumerOptions = {
      ...consumerOptions,
      retry: consumerOptions.retry ?? { restartOnFailure: this.onFailure },
    };
    this._consumer = this.client.consumer(this.consumerOptions);
  }
  /** Kafka consumer */
  public get consumer(): KafkaConsumer {
    return this._consumer;
  }
  /** Perform the connection of the instance to the system */
  public override async start(): Promise<void> {
    try {
      await super.start();
      await this._consumer.connect();
      for (const event of Object.values(this._consumer.events)) {
        this._consumer.on(event, this.eventLogging);
      }
      this._consumer.on('consumer.crash', this.onCrashEvent);
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
      await this._consumer.disconnect();
    } catch (error) {
      const cause = Crash.from(error, this.componentId);
      throw new Crash(`Error in final disconnection process: ${cause.message}`, this.componentId, {
        cause,
      });
    }
  }
  /**
   * Manage error events from KafkaJS library
   * @param context - event context
   */
  private readonly onCrashEvent = (context: ConsumerCrashEvent): void => {
    if (context.payload.error instanceof KafkaJSNonRetriableError) {
      // Stryker disable next-line all
      this.logger.error(`Non retriable error has been received from KafkaJS`);
      if (context.payload.restart === false) {
        // Stryker disable next-line all
        this.logger.error(`KafkaJS will NOT try to fix this error by itself`);
        if (this.listenerCount('error') > 0) {
          const message = `No fixable error in Kafka interface: ${context.payload.error.message}`;
          const crash = new Crash(message, this.componentId, { cause: context.payload.error });
          this.emit('unhealthy', crash);
        }
      } else {
        // Stryker disable next-line all
        this.logger.error(`KafkaJS will try to fix this error by itself`);
      }
    }
  };
}
