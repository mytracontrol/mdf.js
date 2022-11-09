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
  AwaitableSender as RheaSender,
  ConnectionOptions,
  EventContext,
  SenderEvents,
} from 'rhea-promise';
import { inspect } from 'util';
import { SessionClient } from './Session';

export class Sender extends SessionClient {
  /** AMQP Sender */
  private sender?: RheaSender;
  /**
   * Creates an instance of AMQP Sender
   * @param options - Connection options
   */
  constructor(options: ConnectionOptions) {
    super(options);
  }
  /** Return the underlying AMQP sender */
  public get client(): RheaSender {
    if (!this.sender) {
      throw new Crash('Sender is not initialized');
    }
    return this.sender;
  }
  /**
   * Event handler for the sendable event.
   * @param context - EventContext instance
   */
  private readonly onSendableEvent = (context: EventContext) => {
    // Stryker disable next-line all
    this.logger.debug(`A new sendable event has been raised`);
    // Stryker disable next-line all
    this.logger.silly(inspect(context, false, 6));
  };
  /**
   * Event handler for the open event.
   * @param context - EventContext instance
   */
  private readonly onSenderOpenEvent = (context: EventContext) => {
    // Stryker disable next-line all
    this.logger.debug(`A sender_open event has been raised`);
    this.emit('healthy');
    // Stryker disable next-line all
    this.logger.silly(inspect(context, false, 6));
  };
  /**
   * Event handler for the drained event.
   * @param context - EventContext instance
   */
  private readonly onSenderDrainingEvent = (context: EventContext) => {
    // Stryker disable next-line all
    this.logger.debug(`A sender_draining event has been raised`);
    // Stryker disable next-line all
    this.logger.silly(inspect(context, false, 6));
  };
  /**
   * Event handler for the flow event.
   * @param context - EventContext instance
   */
  private readonly onSenderFlowEvent = (context: EventContext) => {
    // Stryker disable next-line all
    this.logger.debug(`A sender_flow event has been raised`);
    // Stryker disable next-line all
    this.logger.silly(inspect(context, false, 6));
  };
  /**
   * Event handler for the error event.
   * @param context - EventContext instance
   */
  private readonly onSenderErrorEvent = (context: EventContext) => {
    const rawError = get(context, 'error', undefined) as AmqpError;
    const message = rawError?.condition
      ? `${rawError.condition} - ${rawError.description}`
      : 'Unknown error';
    const senderError = new Crash(`Sender error: ${message}`, this.componentId, {
      info: { context },
    });
    this.emit('unhealthy', senderError);
    // Stryker disable next-line all
    this.logger.error(senderError.message);
    // Stryker disable next-line all
    this.logger.silly(inspect(context, false, 6));
  };
  /**
   * Event handler for the close event.
   * @param context - EventContext instance
   */
  private readonly onSenderCloseEvent = (context: EventContext) => {
    // Stryker disable next-line all
    this.logger.info(`A sender_close event has been raised`);
    this.emit('closed');
    // Stryker disable next-line all
    this.logger.silly(inspect(context, false, 6));
  };
  /**
   * Event handler for the accepted event.
   * @param context - EventContext instance
   */
  private readonly onSenderAcceptedEvent = (context: EventContext) => {
    // Stryker disable next-line all
    this.logger.debug(`A accepted event has been raised`);
    // Stryker disable next-line all
    this.logger.silly(inspect(context, false, 6));
  };
  /**
   * Event handler for the released event.
   * @param context - EventContext instance
   */
  private readonly onSenderReleasedEvent = (context: EventContext) => {
    // Stryker disable next-line all
    this.logger.debug(`A released event has been raised`);
    // Stryker disable next-line all
    this.logger.silly(inspect(context, false, 6));
  };
  /**
   * Event handler for the rejected event.
   * @param context - EventContext instance
   */
  private readonly onSenderRejectedEvent = (context: EventContext) => {
    // Stryker disable next-line all
    this.logger.debug(`A rejected event has been raised`);
    // Stryker disable next-line all
    this.logger.silly(inspect(context, false, 6));
  };
  /**
   * Event handler for the modified event.
   * @param context - EventContext instance
   */
  private readonly onSenderModifiedEvent = (context: EventContext) => {
    // Stryker disable next-line all
    this.logger.debug(`A modified event has been raised`);
    // Stryker disable next-line all
    this.logger.silly(inspect(context, false, 6));
  };
  /**
   * Event handler for the settled event.
   * @param context - EventContext instance
   */
  private readonly onSenderSettledEvent = (context: EventContext) => {
    // Stryker disable next-line all
    this.logger.info(`A settled event has been raised`);
    // Stryker disable next-line all
    this.logger.silly(inspect(context, false, 6));
  };
  /** Perform the connection to the AMQP broker and the creation of the sender */
  public override async start(): Promise<void> {
    if (this.sender?.isOpen()) {
      return;
    }
    try {
      await super.start();
      if (this.session) {
        this.sender = await this.session.createAwaitableSender();
        this.senderEventsWrapping(this.sender);
      } else {
        throw new Crash('Session is not initialized');
      }
    } catch (rawError) {
      const error = Crash.from(rawError, this.componentId);
      throw new Crash(`Error creating the AMQP Sender: ${error.message}`, this.componentId, {
        cause: error,
      });
    }
  }
  /** Perform the disconnection from the AMQP broker */
  public override async stop(): Promise<void> {
    if (!this.sender?.isOpen()) {
      return;
    }
    try {
      this.senderEventsUnwrapping(this.sender);
      await this.sender.close();
      await super.stop();
    } catch (rawError) {
      const error = Crash.from(rawError, this.componentId);
      throw new Crash(`Error closing the AMQP Sender: ${error.message}`, this.componentId, {
        cause: error,
      });
    }
  }
  /** Return the port state as a boolean value, true if the port is available, false in otherwise */
  public get state(): boolean {
    return this.sender?.isOpen() ?? false;
  }
  /**
   * Attach all the events and log for debugging
   * @param sender - AMQP message sender
   */
  private senderEventsWrapping(sender: RheaSender): RheaSender {
    sender.on(SenderEvents.sendable, this.onSendableEvent);
    sender.on(SenderEvents.senderOpen, this.onSenderOpenEvent);
    sender.on(SenderEvents.senderDraining, this.onSenderDrainingEvent);
    sender.on(SenderEvents.senderFlow, this.onSenderFlowEvent);
    sender.on(SenderEvents.senderError, this.onSenderErrorEvent);
    sender.on(SenderEvents.senderClose, this.onSenderCloseEvent);
    sender.on(SenderEvents.accepted, this.onSenderAcceptedEvent);
    sender.on(SenderEvents.released, this.onSenderReleasedEvent);
    sender.on(SenderEvents.rejected, this.onSenderRejectedEvent);
    sender.on(SenderEvents.modified, this.onSenderModifiedEvent);
    sender.on(SenderEvents.settled, this.onSenderSettledEvent);
    return sender;
  }
  /**
   * Remove all the events listeners
   * @param sender - AMQP message sender
   */
  private senderEventsUnwrapping(sender: RheaSender): RheaSender {
    sender.off(SenderEvents.sendable, this.onSendableEvent);
    sender.off(SenderEvents.senderOpen, this.onSenderOpenEvent);
    sender.off(SenderEvents.senderDraining, this.onSenderDrainingEvent);
    sender.off(SenderEvents.senderFlow, this.onSenderFlowEvent);
    sender.off(SenderEvents.senderError, this.onSenderErrorEvent);
    sender.off(SenderEvents.senderClose, this.onSenderCloseEvent);
    sender.off(SenderEvents.accepted, this.onSenderAcceptedEvent);
    sender.off(SenderEvents.released, this.onSenderReleasedEvent);
    sender.off(SenderEvents.rejected, this.onSenderRejectedEvent);
    sender.off(SenderEvents.modified, this.onSenderModifiedEvent);
    sender.off(SenderEvents.settled, this.onSenderSettledEvent);
    return sender;
  }
}
