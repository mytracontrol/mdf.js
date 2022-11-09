/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { ConsumerAdapter, Control, OnCommandHandler } from '@mdf.js/openc2-core';
import { AdapterOptions, SocketIOClientOptions } from '../../types';
import { SocketIOAdapter } from './SocketIOAdapter';

export class SocketIOConsumerAdapter extends SocketIOAdapter implements ConsumerAdapter {
  /** Incoming message handler */
  private handler?: OnCommandHandler;
  /**
   * Create a new OpenC2 adapter for Socket.IO
   * @param adapterOptions - Adapter configuration options
   * @param options - Socket.IO client configuration options
   */
  constructor(adapterOptions: AdapterOptions, options?: SocketIOClientOptions) {
    super(adapterOptions, 'consumer', options);
  }
  /**
   * Subscribe the incoming message handler to the underlayer transport system
   * @param handler - handler to be used
   * @returns
   */
  public async subscribe(handler: OnCommandHandler): Promise<void> {
    this.handler = handler;
    for (const channel of this.subscriptions) {
      this.provider.client.on(channel, this.subscriptionAdapter);
    }
  }
  /**
   * Unsubscribe the incoming message handler from the underlayer transport system
   * @param handler - handler to be used
   * @returns
   */
  public async unsubscribe(handler: OnCommandHandler): Promise<void> {
    this.handler = undefined;
    for (const channel of this.subscriptions) {
      this.provider.client.off(channel, this.subscriptionAdapter);
    }
  }
  /** Wrapper function for message adaptation */
  private readonly subscriptionAdapter = (
    incomingMessage: Control.CommandMessage,
    acknowledge: (message: Control.ResponseMessage) => void
  ): void => {
    if (this.handler) {
      try {
        const onDone = async (
          error?: Crash | Error,
          message?: Control.ResponseMessage
        ): Promise<void> => {
          if (!error && message) {
            acknowledge(message);
          } else if (error) {
            this.onErrorHandler(error);
          }
        };
        this.handler(incomingMessage, onDone);
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
