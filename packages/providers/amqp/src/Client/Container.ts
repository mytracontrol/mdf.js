/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { DebugLogger, LoggerInstance, SetContext } from '@mdf.js/logger';
import EventEmitter from 'events';
import { get } from 'lodash';
import {
  Connection,
  ConnectionError,
  ConnectionEvents,
  ConnectionOptions,
  EventContext,
  ProtocolError,
} from 'rhea-promise';
import { inspect } from 'util';
import { v4 } from 'uuid';

export class Container extends EventEmitter {
  /** Instance identification */
  protected readonly componentId = v4();
  /** Connection instance */
  protected readonly connection: Connection;
  /** Debug logger for development and deep troubleshooting */
  protected readonly logger: LoggerInstance;
  /**
   * Creates an instance of AMQP Container
   * @param options - Connection options
   */
  constructor(protected readonly options: ConnectionOptions) {
    super();
    this.connection = new Connection(this.options);
    this.logger = SetContext(new DebugLogger('client:amqp'), 'amqp', this.componentId);
    // Stryker disable next-line all
    this.logger.debug(`New instance of AMQP port created: ${this.componentId}`);
  }
  /**
   * Event handler for the connection open event
   * @param context - EventContext instance
   */
  private readonly onConnectionOpen = (context: EventContext): void => {
    // Stryker disable next-line all
    this.logger.debug(`Connection has been established`);
    // Stryker disable next-line all
    this.logger.silly(inspect(context, false, 6));
  };
  /**
   * Event handler for the connection close event
   * @param context - EventContext instance
   */
  private readonly onConnectionCloseEvent = (context: EventContext): void => {
    // Stryker disable next-line all
    this.logger.debug(`Connection has been closed`);
    // Stryker disable next-line all
    this.logger.silly(inspect(context, false, 6));
  };
  /**
   * Event handler for the connection error event
   * @param context - EventContext instance
   */
  private readonly onConnectionErrorEvent = (context: EventContext): void => {
    const rawError = get(context, 'error', undefined) as ConnectionError;
    const error = Crash.from(rawError, this.componentId);
    this.onError(
      new Crash(`Connection error: ${error.message}`, this.componentId, { info: { context } })
    );
    // Stryker disable next-line all
    this.logger.silly(inspect(context, false, 6));
  };
  /**
   * Event handler for the protocol error event
   * @param context - EventContext instance
   */
  private readonly onProtocolErrorEvent = (context: EventContext): void => {
    const rawError = get(context, 'error', undefined) as ProtocolError;
    const error = Crash.from(rawError, this.componentId);
    this.onError(
      new Crash(`Protocol error: ${error.message}`, this.componentId, { info: { context } })
    );
    // Stryker disable next-line all
    this.logger.silly(inspect(context, false, 6));
  };
  /**
   * Event handler for the container error event
   * @param context - EventContext instance
   */
  private readonly onErrorEvent = (context: EventContext): void => {
    const rawError = get(context, 'error', undefined) as Error;
    const error = Crash.from(rawError, this.componentId);
    this.onError(
      new Crash(`Container error: ${error.message}`, this.componentId, { info: { context } })
    );
    // Stryker disable next-line all
    this.logger.silly(inspect(context, false, 6));
  };
  /**
   * Event handler for the disconnect event
   * @param context - EventContext instance
   */
  private readonly onDisconnectedEvent = (context: EventContext): void => {
    const rawError = get(context, 'error', undefined) as Error;
    const reconnecting = get(context, 'reconnecting', false);
    const error = Crash.from(rawError, this.componentId);
    const disconnectionError = new Crash(
      `Disconnection error: ${error.message}`,
      this.componentId,
      { info: rawError }
    );
    if (reconnecting) {
      // Stryker disable next-line all
      this.logger.debug(`Is supposed that we are reconnecting`);
    }
    // Stryker disable next-line all
    this.logger.error(disconnectionError.message);
    this.emit(`unhealthy`, disconnectionError);
    // Stryker disable next-line all
    this.logger.silly(inspect(context, false, 6));
  };
  /**
   * Event handler for the settled event
   * @param context - EventContext instance
   */
  private readonly onSettledEvent = (context: EventContext): void => {
    // Stryker disable next-line all
    this.logger.silly(inspect(context, false, 6));
  };
  /**
   * Manage the error in the AMQP Client
   * @param error - Error instance
   */
  protected onError(error: Crash): void {
    // Stryker disable next-line all
    this.logger.error(error.message);
    if (this.listenerCount('error') > 0) {
      this.emit(`error`, error);
    }
  }
  /** Perform the connection to the AMQP broker */
  protected async start(): Promise<void> {
    if (this.connection.isOpen()) {
      return;
    }
    try {
      await this.connection.open();
      this.eventsWrapping(this.connection);
    } catch (rawError) {
      const error = Crash.from(rawError, this.componentId);
      throw new Crash(`Error opening the AMQP connection: ${error.message}`, this.componentId, {
        cause: error,
      });
    }
  }
  /** Perform the disconnection from the AMQP broker */
  protected async stop(): Promise<void> {
    if (!this.connection.isOpen()) {
      return;
    }
    try {
      this.eventsUnwrapping(this.connection);
      await this.connection.close();
    } catch (rawError) {
      const error = Crash.from(rawError, this.componentId);
      throw new Crash(`Error closing the AMQP connection: ${error.message}`, this.componentId, {
        cause: error,
      });
    }
  }
  /**
   * Attach all the events and log for debugging
   * @param connection - AMQP Connection instance
   */
  private eventsWrapping(connection: Connection): Connection {
    connection.on(ConnectionEvents.connectionOpen, this.onConnectionOpen);
    connection.on(ConnectionEvents.connectionClose, this.onConnectionCloseEvent);
    connection.on(ConnectionEvents.connectionError, this.onConnectionErrorEvent);
    connection.on(ConnectionEvents.protocolError, this.onProtocolErrorEvent);
    connection.on(ConnectionEvents.error, this.onErrorEvent);
    connection.on(ConnectionEvents.disconnected, this.onDisconnectedEvent);
    connection.on(ConnectionEvents.settled, this.onSettledEvent);
    return connection;
  }
  /**
   * Remove all the events listeners
   * @param connection - AMQP Connection instance
   */
  private eventsUnwrapping(connection: Connection): Connection {
    connection.off(ConnectionEvents.connectionOpen, this.onConnectionOpen);
    connection.off(ConnectionEvents.connectionClose, this.onConnectionCloseEvent);
    connection.off(ConnectionEvents.connectionError, this.onConnectionErrorEvent);
    connection.off(ConnectionEvents.protocolError, this.onProtocolErrorEvent);
    connection.off(ConnectionEvents.error, this.onErrorEvent);
    connection.off(ConnectionEvents.disconnected, this.onDisconnectedEvent);
    connection.off(ConnectionEvents.settled, this.onSettledEvent);
    return connection;
  }
}
