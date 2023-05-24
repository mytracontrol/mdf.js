/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { KafkaConfig, Producer as KafkaProducer, ProducerConfig } from 'kafkajs';
import { Client } from './Client';

export class Producer extends Client {
  /** Kafka Producer */
  private readonly producer: KafkaProducer;
  /** Kafka Producer configuration options */
  private readonly producerOptions: ProducerConfig;
  /**
   * Creates an instance of KafkaProducer
   * @param clientOptions - Kafka client configuration options
   * @param producerOptions - Kafka producer configuration options
   * @param interval - Period of health check interval
   */
  constructor(clientOptions: KafkaConfig, producerOptions?: ProducerConfig, interval?: number) {
    super(clientOptions, interval);
    this.producerOptions = {
      ...producerOptions,
      retry: producerOptions?.retry ?? { restartOnFailure: this.onFailure },
    };
    this.producer = this.instance.producer(this.producerOptions);
  }
  /** Return the producer of this class instance */
  public get client(): KafkaProducer {
    return this.producer;
  }
  /** Perform the connection of the instance to the system */
  public override async start(): Promise<void> {
    try {
      await super.start();
      await this.producer.connect();
      for (const event of Object.values(this.producer.events)) {
        this.producer.on(event, this.eventLogging);
      }
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
