/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { ConsumerAdapter, Control, OnCommandHandler } from '@mdf.js/openc2-core';
import { Redis } from '@mdf.js/redis-provider';
import { AdapterOptions } from '../../types';
import { RedisAdapter } from './RedisAdapter';

export class RedisConsumerAdapter extends RedisAdapter implements ConsumerAdapter {
  /** Incoming message handler */
  private handler?: OnCommandHandler;
  /**
   * Create a new OpenC2 adapter for Redis
   * @param adapterOptions - Adapter configuration options
   * @param redisOptions - Redis configuration options
   */
  constructor(adapterOptions: AdapterOptions, redisOptions?: Redis.Config) {
    super(adapterOptions, 'consumer', redisOptions);
  }
  /**
   * Subscribe the incoming message handler to the underlayer transport system
   * @param handler - handler to be used
   * @returns
   */
  public async subscribe(handler: OnCommandHandler): Promise<void> {
    this.handler = handler;
    this.subscriber.client.on('pmessage', this.subscriptionAdapter);
  }
  /**
   * Unsubscribe the incoming message handler from the underlayer transport system
   * @param handler - handler to be used
   * @returns
   */
  public async unsubscribe(handler: OnCommandHandler): Promise<void> {
    this.handler = undefined;
    this.subscriber.client.off('pmessage', this.subscriptionAdapter);
  }
  /**
   * Perform the publication of the message in the underlayer transport system
   * @param message - message to be published
   * @returns
   */
  private async publish(message: Control.ResponseMessage): Promise<void> {
    try {
      const topics = this.defineTopics(message);
      const parsedMessage = JSON.stringify(message);
      for (const topic of topics) {
        await this.publisher.client.publish(topic, parsedMessage);
      }
    } catch (rawError) {
      const error = Crash.from(rawError);
      this.onErrorHandler(
        new Crash(`Error performing the publication of the message: ${error.message}`, error.uuid, {
          cause: error,
        })
      );
    }
  }
  /** Wrapper function for message adaptation */
  private readonly subscriptionAdapter = (
    pattern: string,
    topic: string,
    incomingMessage: string
  ): void => {
    if (this.handler) {
      try {
        const parsedMessage = JSON.parse(incomingMessage);
        const onDone = async (
          error?: Crash | Error,
          message?: Control.ResponseMessage
        ): Promise<void> => {
          if (!error && message) {
            await this.publish(message);
          } else if (error) {
            this.onErrorHandler(error);
          }
        };
        this.handler(parsedMessage, onDone);
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
    }
  };
}
