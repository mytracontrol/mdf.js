/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { Control, ProducerAdapter } from '@mdf.js/openc2-core';
import { Redis } from '@mdf.js/redis-provider';
import { AdapterOptions } from '../../types';
import { RedisAdapter } from './RedisAdapter';

export class RedisProducerAdapter extends RedisAdapter implements ProducerAdapter {
  /**
   * Create a new OpenC2 adapter for Redis
   * @param redisOptions - Redis configuration options
   * @param adapterOptions - Adapter configuration options
   */
  constructor(adapterOptions: AdapterOptions, redisOptions?: Redis.Config) {
    super(adapterOptions, 'producer', redisOptions);
    this.subscriber.client.on('pmessage', this.subscriptionAdapter);
  }
  /**
   * Perform the publication of the message in the underlayer transport system
   * @param message - message to be published
   * @returns
   */
  public async publish(
    message: Control.CommandMessage
  ): Promise<Control.ResponseMessage | Control.ResponseMessage[] | void> {
    try {
      const topics = this.defineTopics(message);
      const parsedMessage = JSON.stringify(message);
      for (const topic of topics) {
        await this.publisher.client.publish(topic, parsedMessage);
      }
    } catch (rawError) {
      const error = Crash.from(rawError);
      throw new Crash(
        `Error performing the publication of the message: ${error.message}`,
        error.uuid,
        { cause: error }
      );
    }
  }
  /** Wrapper function for message adaptation */
  private readonly subscriptionAdapter = (
    pattern: string,
    topic: string,
    incomingMessage: string
  ) => {
    try {
      const message = JSON.parse(incomingMessage);
      this.emit(message.request_id, message);
    } catch (rawError) {
      const error = Crash.from(rawError);
      this.onErrorHandler(
        new Crash(
          `Error performing the adaptation of the incoming message: ${error.message}`,
          error.uuid,
          { cause: error }
        )
      );
    }
  };
}
