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
  private readonly _producer: KafkaProducer;
  /** Kafka Producer configuration options */
  private readonly producerOptions: ProducerConfig;
  /**
   * Creates an instance of KafkaProducer
   * @param clientOptions - Kafka client configuration options
   * @param producerOptions - Kafka producer configuration options
   */
  constructor(clientOptions: KafkaConfig, producerOptions: ProducerConfig) {
    super(clientOptions);
    this.producerOptions = {
      ...producerOptions,
      retry: producerOptions.retry ?? { restartOnFailure: this.onFailure },
    };
    this._producer = this.client.producer(this.producerOptions);
  }
  /** Return the producer of this class instance */
  get producer(): KafkaProducer {
    return this._producer;
  }
  /** Perform the connection of the instance to the system */
  public override async start(): Promise<void> {
    try {
      await super.start();
      await this._producer.connect();
      for (const event of Object.values(this._producer.events)) {
        this._producer.on(event, this.eventLogging);
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
      await this._producer.disconnect();
    } catch (error) {
      const cause = Crash.from(error, this.componentId);
      throw new Crash(`Error in final disconnection process: ${cause.message}`, this.componentId, {
        cause,
      });
    }
  }
}
