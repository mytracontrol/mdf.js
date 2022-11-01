/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Mytra Control S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Mytra Control S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Mytra Control S.L.
 */
import { Crash } from '@mdf.js/crash';
import { LoggerInstance, Provider } from '@mdf.js/provider';
import {
  CommandFailedEvent,
  CommandSucceededEvent,
  MongoClient,
  ServerHeartbeatFailedEvent,
  ServerHeartbeatSucceededEvent,
} from 'mongodb';
import { inspect } from 'util';
import { CONFIG_PROVIDER_BASE_NAME } from '../config';
import { Client, Config, MONGO_CLIENT_EVENTS } from './types';

export class Port extends Provider.Port<Client, Config> {
  /** Mongo connection handler */
  private instance: Client;
  /** Connection flag */
  private isConnected: boolean;
  /** Mongo healthy state */
  private healthy: boolean;
  /** Last failed command */
  private lastFailedCommands: string[] = [];
  /**
   * Implementation of functionalities of a Mongo port instance.
   * @param config - Port configuration options
   * @param logger - Port logger, to be used internally
   */
  constructor(config: Config, logger: LoggerInstance) {
    super(config, logger, config.appName || CONFIG_PROVIDER_BASE_NAME);
    const cleanedOptions = { ...this.config, url: undefined } as Config;
    this.instance = new MongoClient(config.url as string, cleanedOptions);
    // Stryker disable next-line all
    this.logger.debug(`New instance of Mongo port created: ${this.uuid}`, this.uuid, this.name);
    this.isConnected = false;
    this.healthy = false;
  }
  /** Return the underlying port instance */
  public get client(): Client {
    return this.instance;
  }
  /** Return the port state as a boolean value, true if the port is available, false in otherwise */
  public get state(): boolean {
    return this.healthy;
  }
  /** Start the port, making it available */
  public async start(): Promise<void> {
    if (this.isConnected) {
      // Stryker disable next-line all
      this.logger.warn(`Port already started`, this.uuid, this.name);
      return;
    }
    try {
      await this.instance.connect();
      this.instance = this.eventsWrapping(this.instance);
      this.isConnected = true;
    } catch (rawError) {
      const error = Crash.from(rawError);
      throw new Crash(`Error starting Mongo port: ${error.message}`, this.uuid, { cause: error });
    }
  }
  /** Stop the port, making it unavailable */
  public async stop(): Promise<void> {
    if (!this.isConnected) {
      // Stryker disable next-line all
      this.logger.warn(`Port already stopped`, this.uuid, this.name);
      return;
    }
    try {
      await this.instance.close();
      this.instance = this.eventsUnwrapping(this.instance);
      this.isConnected = false;
    } catch (rawError) {
      const error = Crash.from(rawError);
      throw new Crash(`Error stopping Mongo port: ${error.message}`, this.uuid, { cause: error });
    }
  }
  /** Close the port, alias to stop */
  public async close(): Promise<void> {
    await this.stop();
  }
  /**
   * Manage the event of a command failed
   * @param event - event to be handled
   */
  private onCommandFailed = (event: CommandFailedEvent): void => {
    const time = new Date().toISOString();
    this.addCheck('lastCommand', {
      componentId: this.uuid,
      observedValue: 'failed',
      observedUnit: 'command result',
      status: 'fail',
      output: `${event.commandName} - ${event.failure.message}`,
      time,
    });
    this.lastFailedCommands.push(`${time} - ${event.commandName} - ${event.failure.message}`);
    if (this.lastFailedCommands.length > 10) {
      this.lastFailedCommands.shift();
    }
    this.addCheck('lastFailedCommands', {
      componentId: this.uuid,
      observedValue: this.lastFailedCommands,
      observedUnit: 'last failed commands',
      status: 'pass',
      output: undefined,
      time,
    });
  };
  /**
   * Manage the event of a command succeeded
   * @param event - event to be handled
   */
  private onCommandSucceeded = (event: CommandSucceededEvent): void => {
    this.addCheck('lastCommand', {
      componentId: this.uuid,
      observedValue: 'succeeded',
      observedUnit: 'command result',
      status: 'pass',
      output: undefined,
      time: new Date().toISOString(),
    });
  };
  /**
   * Manage the event of a heartbeat failed
   * @param event - event to be handled
   */
  private onServerHeartbeatFailed = (event: ServerHeartbeatFailedEvent): void => {
    this.addCheck('heartbeat', {
      componentId: this.uuid,
      observedValue: 'failed',
      observedUnit: 'heartbeat result',
      status: 'fail',
      output: `${event.connectionId} - ${event.failure.message}`,
      time: new Date().toISOString(),
    });
    if (this.healthy) {
      this.emit(
        'unhealthy',
        new Crash(`Mongo port is unhealthy: ${event.failure.message}`, this.uuid)
      );
    }
    this.healthy = false;
  };
  /**
   * Manage the event of a server heartbeat succeeded
   * @param event - event to be handled
   */
  private onServerHeartbeatSucceeded = (event: ServerHeartbeatSucceededEvent): void => {
    this.addCheck('heartbeat', {
      componentId: this.uuid,
      observedValue: event,
      observedUnit: 'heartbeat result',
      status: 'pass',
      output: undefined,
      time: new Date().toISOString(),
    });
    if (!this.healthy) {
      this.emit('healthy');
    }
    this.healthy = true;
  };
  /**
   * Wrap the events of the Mongo client
   * @param event - event to be handled
   * @returns
   */
  private onEvent = (event: string): ((meta: unknown) => void) => {
    return (meta: unknown): void => {
      this.logger.silly(`New incoming [${event}] event from Mongo with meta: ${inspect(meta)}`);
    };
  };
  /**
   * Attach all the events and log for debugging
   * @param instance - client where the event managers will be attached
   */
  private eventsWrapping(instance: MongoClient): MongoClient {
    instance.on('commandSucceeded', this.onCommandSucceeded);
    instance.on('commandFailed', this.onCommandFailed);
    instance.on('serverHeartbeatSucceeded', this.onServerHeartbeatSucceeded);
    instance.on('serverHeartbeatFailed', this.onServerHeartbeatFailed);
    for (const event of MONGO_CLIENT_EVENTS) {
      instance.on(event, this.onEvent(event));
    }
    return instance;
  }
  /**
   * Remove all the events
   * @param instance - client where the event managers will be unattached
   */
  private eventsUnwrapping(instance: MongoClient): MongoClient {
    instance.off('commandSucceeded', this.onCommandSucceeded);
    instance.off('commandFailed', this.onCommandFailed);
    instance.off('serverHeartbeatSucceeded', this.onServerHeartbeatSucceeded);
    instance.off('serverHeartbeatFailed', this.onServerHeartbeatFailed);
    for (const event of MONGO_CLIENT_EVENTS) {
      instance.removeAllListeners(event);
    }
    return instance;
  }
}
