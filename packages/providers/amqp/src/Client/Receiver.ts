/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { get } from 'lodash';
import {
  AmqpError,
  ConnectionOptions,
  EventContext,
  Receiver as RheaReceiver,
  ReceiverEvents,
} from 'rhea-promise';
import { inspect } from 'util';
import { SessionClient } from './Session';

export class Receiver extends SessionClient {
  /** AMQP Receiver */
  private receiver?: RheaReceiver;
  /**
   * Creates an instance of AMQP Container
   * @param options - Connection options
   */
  constructor(options: ConnectionOptions) {
    super(options);
  }
  /** Return the underlying AMQP receiver */
  public get client(): RheaReceiver {
    if (!this.receiver) {
      throw new Crash('Receiver is not initialized');
    }
    return this.receiver;
  }
  /**
   * Event handler for the message event.
   * @param context - EventContext instance
   */
  private readonly onMessageEvent = (context: EventContext) => {
    // Stryker disable next-line all
    this.logger.debug(`A new message has been received on channel`);
    // Stryker disable next-line all
    this.logger.silly(inspect(context, false, 6));
  };
  /**
   * Event handler for the open event.
   * @param context - EventContext instance
   */
  private readonly onReceiverOpenEvent = (context: EventContext) => {
    // Stryker disable next-line all
    this.logger.info(`A receiver_open event has been raised`);
    this.emit('healthy');
    // Stryker disable next-line all
    this.logger.silly(inspect(context, false, 6));
  };
  /**
   * Event handler for the drained event.
   * @param context - EventContext instance
   */
  private readonly onReceiverDrainedEvent = (context: EventContext) => {
    // Stryker disable next-line all
    this.logger.info(`A receiver_drained event has been raised`);
    // Stryker disable next-line all
    this.logger.silly(inspect(context, false, 6));
  };
  /**
   * Event handler for the flow event.
   * @param context - EventContext instance
   */
  private readonly onReceiverFlowEvent = (context: EventContext) => {
    // Stryker disable next-line all
    this.logger.info(`A receiver_flow event has been raised`);
    // Stryker disable next-line all
    this.logger.silly(inspect(context, false, 6));
  };
  /**
   * Event handler for the error event.
   * @param context - EventContext instance
   */
  private readonly onReceiverErrorEvent = (context: EventContext) => {
    const rawError = get(context, 'receiver.error', undefined) as AmqpError;
    const message = rawError?.condition
      ? `${rawError.condition} - ${rawError.description}`
      : 'Unknown error';
    const receiverError = new Crash(`Receiver error: ${message}`, this.componentId, {
      info: { context },
    });
    this.emit('unhealthy', receiverError);
    // Stryker disable next-line all
    this.logger.error(receiverError.message);
    // Stryker disable next-line all
    this.logger.silly(inspect(context, false, 6));
  };
  /**
   * Event handler for the close event.
   * @param context - EventContext instance
   */
  private readonly onReceiverCloseEvent = (context: EventContext) => {
    // Stryker disable next-line all
    this.logger.info(`A receiver_close event has been raised`);
    this.emit('closed');
    // Stryker disable next-line all
    this.logger.silly(inspect(context, false, 6));
  };
  /**
   * Event handler for the settle event.
   * @param context - EventContext instance
   */
  private readonly onReceivedSettledEvent = (context: EventContext) => {
    // Stryker disable next-line all
    this.logger.info(`A settled event has been raised`);
    // Stryker disable next-line all
    this.logger.silly(inspect(context, false, 6));
  };
  /** Perform the connection to the AMQP broker and the creation of the receiver */
  public override async start(): Promise<void> {
    if (this.receiver?.isOpen()) {
      return;
    }
    try {
      await super.start();
      if (this.session) {
        this.receiver = await this.session.createReceiver();
        this.receiverEventsWrapping(this.receiver);
      } else {
        throw new Crash('Session is not initialized', this.componentId);
      }
    } catch (rawError) {
      const error = Crash.from(rawError, this.componentId);
      throw new Crash(`Error creating the AMQP Receiver: ${error.message}`, this.componentId, {
        cause: error,
      });
    }
  }
  /** Perform the disconnection from the AMQP broker */
  public override async stop(): Promise<void> {
    if (!this.receiver?.isOpen()) {
      return;
    }
    try {
      this.receiverEventsUnwrapping(this.receiver);
      await this.receiver.close();
      await super.stop();
    } catch (rawError) {
      const error = Crash.from(rawError, this.componentId);
      throw new Crash(`Error closing the AMQP Receiver: ${error.message}`, this.componentId, {
        cause: error,
      });
    }
  }
  /** Return the port state as a boolean value, true if the port is available, false in otherwise */
  public get state(): boolean {
    return this.receiver?.isOpen() ?? false;
  }
  /**
   * Attach all the events and log for debugging
   * @param received - AMQP message received
   */
  private receiverEventsWrapping(receiver: RheaReceiver): RheaReceiver {
    receiver.on(ReceiverEvents.message, this.onMessageEvent);
    receiver.on(ReceiverEvents.receiverOpen, this.onReceiverOpenEvent);
    receiver.on(ReceiverEvents.receiverDrained, this.onReceiverDrainedEvent);
    receiver.on(ReceiverEvents.receiverFlow, this.onReceiverFlowEvent);
    receiver.on(ReceiverEvents.receiverError, this.onReceiverErrorEvent);
    receiver.on(ReceiverEvents.receiverClose, this.onReceiverCloseEvent);
    receiver.on(ReceiverEvents.settled, this.onReceivedSettledEvent);
    return receiver;
  }
  /**
   * Remove all the events listeners
   * @param received - AMQP message received
   */
  private receiverEventsUnwrapping(receiver: RheaReceiver): RheaReceiver {
    receiver.off(ReceiverEvents.message, this.onMessageEvent);
    receiver.off(ReceiverEvents.receiverOpen, this.onReceiverOpenEvent);
    receiver.off(ReceiverEvents.receiverDrained, this.onReceiverDrainedEvent);
    receiver.off(ReceiverEvents.receiverFlow, this.onReceiverFlowEvent);
    receiver.off(ReceiverEvents.receiverError, this.onReceiverErrorEvent);
    receiver.off(ReceiverEvents.receiverClose, this.onReceiverCloseEvent);
    receiver.off(ReceiverEvents.settled, this.onReceivedSettledEvent);
    return receiver;
  }
}
