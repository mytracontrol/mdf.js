/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { Accessors, Control, ProducerAdapter } from '@mdf.js/openc2-core';
import { AdapterOptions, SocketIOClientOptions } from '../../types';
import { SocketIOAdapter } from './SocketIOAdapter';

const DEFAULT_EXTRA_DELAY_TIME_FOR_RESPONSE = 100;
export class SocketIOProducerAdapter extends SocketIOAdapter implements ProducerAdapter {
  /**
   * Create a new OpenC2 adapter for Socket.IO
   * @param adapterOptions - Adapter configuration options
   * @param options - Socket.IO client configuration options
   */
  constructor(adapterOptions: AdapterOptions, options?: SocketIOClientOptions) {
    super(adapterOptions, 'producer', options);
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
      const timeout =
        Accessors.getDelayFromCommandMessage(message) + DEFAULT_EXTRA_DELAY_TIME_FOR_RESPONSE;
      const topics = this.defineTopics(message);
      for (const topic of topics) {
        this.provider.client
          .timeout(timeout)
          .emit(topic, message, this.subscriptionAdapter.bind(this));
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
    error: Error | null,
    incomingMessage: Control.ResponseMessage | Control.ResponseMessage[]
  ) => {
    if (error) {
      this.onErrorHandler(Crash.from(error));
      return;
    } else if (!incomingMessage) {
      this.onErrorHandler(
        new Crash(
          `No response was received, but we didn't receive any error either, check the consumers`,
          this.componentId
        )
      );
      return;
    }
    if (Array.isArray(incomingMessage)) {
      for (const message of incomingMessage) {
        this.emit(message.request_id, message);
      }
    } else {
      this.emit(incomingMessage.request_id, incomingMessage);
    }
  };
}
