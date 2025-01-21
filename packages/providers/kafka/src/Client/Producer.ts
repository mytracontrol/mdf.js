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

export class Producer extends Client {
  /** Kafka Producer */
  private readonly producer: KafkaJS.Producer;
  /** Kafka Producer configuration options */
  private readonly producerOptions: KafkaJS.ProducerConfig;
  /**
   * Creates an instance of KafkaProducer
   * @param clientOptions - Kafka client configuration options
   * @param producerOptions - Kafka producer configuration options
   * @param interval - Period of health check interval
   */
  constructor(
    clientOptions: KafkaJS.CommonConstructorConfig & { kafkaJS: KafkaJS.KafkaConfig }, // TODO: Check,
    producerOptions?: KafkaJS.ProducerConfig,
    interval?: number
  ) {
    super(clientOptions, interval);
    this.producerOptions = {
      ...producerOptions,
      retry: producerOptions?.retry,
      // logger: defaultLogger,
    };
    this.producer = this.instance.producer({ kafkaJS: cleanObject(this.producerOptions) });
  }
  /** Return the producer of this class instance */
  public get client(): KafkaJS.Producer {
    return this.producer;
  }
  /** Perform the connection of the instance to the system */
  public override async start(): Promise<void> {
    try {
      await super.start();
      await this.producer.connect();
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
      await this.producer.disconnect();
    } catch (error) {
      const cause = Crash.from(error, this.componentId);
      throw new Crash(`Error in disconnection process: ${cause.message}`, this.componentId, {
        cause,
      });
    }
  }
}
