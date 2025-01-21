/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { KafkaJS } from '@confluentinc/kafka-javascript';
import { Crash } from '@mdf.js/crash';
import { cleanObject } from '../Common';
import { Client } from './Client';

export class Consumer extends Client {
  /** Kafka Consumer */
  private readonly consumer: KafkaJS.Consumer;
  /** Kafka Consumer configuration options */
  readonly consumerOptions: KafkaJS.ConsumerConfig;
  /**
   * Creates an instance of KafkaConsumer
   * @param clientOptions - Kafka client configuration options
   * @param consumerOptions - Kafka consumer configuration options
   * @param interval - Period of health check interval
   */
  constructor(
    clientOptions: KafkaJS.CommonConstructorConfig & { kafkaJS: KafkaJS.KafkaConfig },
    consumerOptions: KafkaJS.ConsumerConfig,
    interval?: number
  ) {
    super(clientOptions, interval);
    this.consumerOptions = {
      ...consumerOptions,
      retry: consumerOptions.retry,
      // logger: defaultLogger,
    };
    this.consumer = this.instance.consumer({ kafkaJS: cleanObject(this.consumerOptions) });
  }
  /** Kafka consumer */
  public get client(): KafkaJS.Consumer {
    return this.consumer;
  }
  /** Perform the connection of the instance to the system */
  public override async start(): Promise<void> {
    try {
      await super.start();
      await this.consumer.connect();
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

  // public override async listTopics(): Promise<string[]> {
  //   return await super.listTopics();
  // }
}
