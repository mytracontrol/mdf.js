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
  Session as RheaSession,
  SessionEvents,
} from 'rhea-promise';
import { inspect } from 'util';
import { Container } from './Container';

export class SessionClient extends Container {
  /** AMQP Session */
  protected session?: RheaSession;
  /**
   * Creates an instance of AMQP Session
   * @param options - Connection options
   */
  constructor(options: ConnectionOptions) {
    super(options);
  }
  /**
   * Event handler for the open event.
   * @param context - EventContext instance
   */
  private readonly onSessionOpenEvent = (context: EventContext) => {
    // Stryker disable next-line all
    this.logger.info(`A session_open event has been raised`);
    // Stryker disable next-line all
    this.logger.silly(inspect(context, false, 6));
  };
  /**
   * Event handler for the error event.
   * @param context - EventContext instance
   */
  private readonly onSessionErrorEvent = (context: EventContext) => {
    const rawError = get(context, 'session.error', undefined) as AmqpError;
    const message = rawError?.condition
      ? `${rawError.condition} - ${rawError.description}`
      : 'Unknown error';
    const receiverError = new Crash(`Session error: ${message}`, this.componentId, {
      info: { context },
    });
    this.emit('error', receiverError);
    // Stryker disable next-line all
    this.logger.error(receiverError.message);
    // Stryker disable next-line all
    this.logger.silly(inspect(context, false, 6));
  };
  /**
   * Event handler for the close event.
   * @param context - EventContext instance
   */
  private readonly onSessionClose = (context: EventContext) => {
    // Stryker disable next-line all
    this.logger.info(`A session_close event has been raised`);
    // Stryker disable next-line all
    this.logger.silly(inspect(context, false, 6));
  };
  /**
   * Event handler for the settle event.
   * @param context - EventContext instance
   */
  private readonly onSessionSettledEvent = (context: EventContext) => {
    // Stryker disable next-line all
    this.logger.info(`A settled event has been raised`);
    // Stryker disable next-line all
    this.logger.silly(inspect(context, false, 6));
  };
  /** Perform the connection to the AMQP broker and the creation of the receiver */
  public override async start(): Promise<void> {
    if (this.session?.isOpen()) {
      return;
    }
    try {
      await super.start();
      this.session = await this.connection.createSession();
      this.sessionEventsWrapping(this.session);
    } catch (rawError) {
      const error = Crash.from(rawError, this.componentId);
      throw new Crash(`Error creating the AMQP Session: ${error.message}`, this.componentId, {
        cause: error,
      });
    }
  }
  /** Perform the disconnection from the AMQP broker */
  public override async stop(): Promise<void> {
    if (!this.session?.isOpen()) {
      return;
    }
    try {
      this.sessionEventsUnwrapping(this.session);
      await this.session.close();
      await super.stop();
    } catch (rawError) {
      const error = Crash.from(rawError, this.componentId);
      throw new Crash(`Error closing the AMQP Session: ${error.message}`, this.componentId, {
        cause: error,
      });
    }
  }
  /**
   * Attach all the events and log for debugging
   * @param session - AMQP message session
   */
  private sessionEventsWrapping(session: RheaSession): RheaSession {
    session.on(SessionEvents.sessionOpen, this.onSessionOpenEvent);
    session.on(SessionEvents.sessionError, this.onSessionErrorEvent);
    session.on(SessionEvents.sessionClose, this.onSessionClose);
    session.on(SessionEvents.settled, this.onSessionSettledEvent);
    return session;
  }
  /**
   * Remove all the events listeners
   * @param session - AMQP message session
   */
  private sessionEventsUnwrapping(session: RheaSession): RheaSession {
    session.off(SessionEvents.sessionOpen, this.onSessionOpenEvent);
    session.off(SessionEvents.sessionError, this.onSessionErrorEvent);
    session.off(SessionEvents.sessionClose, this.onSessionClose);
    session.off(SessionEvents.settled, this.onSessionSettledEvent);
    return session;
  }
}
