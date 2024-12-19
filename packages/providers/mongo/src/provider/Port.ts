/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Layer } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { LoggerInstance } from '@mdf.js/logger';
import {
  CommandFailedEvent,
  CommandSucceededEvent,
  MongoClient,
  ServerHeartbeatFailedEvent,
  ServerHeartbeatSucceededEvent,
} from 'mongodb';
import { inspect } from 'util';
import { CONFIG_PROVIDER_BASE_NAME } from '../config';
import { Client, Collections, Config, MONGO_CLIENT_EVENTS } from './types';

export class Port extends Layer.Provider.Port<Client, Config> {
  /** Mongo connection handler */
  private instance: Client;
  /** Connection flag */
  private isConnected: boolean;
  /** Mongo healthy state */
  private healthy: boolean;
  /** Last failed command */
  private readonly lastFailedCommands: string[] = [];
  /**
   * Implementation of functionalities of a Mongo port instance.
   * @param config - Port configuration options
   * @param logger - Port logger, to be used internally
   */
  constructor(config: Config, logger: LoggerInstance) {
    super(config, logger, config.appName ?? CONFIG_PROVIDER_BASE_NAME);
    const cleanedOptions = { ...this.config, url: undefined, collections: undefined } as Config;
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
      if (this.config.collections) {
        await this.createCollections(this.config.collections);
      }
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
  private readonly onCommandFailed = (event: CommandFailedEvent): void => {
    const date = new Date();
    this.addCheck('lastCommand', {
      componentId: this.uuid,
      observedValue: 'failed',
      observedUnit: 'command result',
      status: 'fail',
      output: `${event.commandName} - ${event.failure.message}`,
      time: date.toISOString(),
    });
    this.lastFailedCommands.push(
      `${date.toISOString()} - ${event.commandName} - ${event.failure.message}`
    );
    if (this.lastFailedCommands.length > 10) {
      this.lastFailedCommands.shift();
    }
    this.addCheck('lastFailedCommands', {
      componentId: this.uuid,
      observedValue: this.lastFailedCommands,
      observedUnit: 'last failed commands',
      status: 'pass',
      output: undefined,
      time: date.toISOString(),
    });
    this.emit(
      'error',
      new Crash(`${event.commandName} - ${event.failure.message}`, this.uuid, {
        info: { date, event },
      })
    );
  };
  /**
   * Manage the event of a command succeeded
   * @param event - event to be handled
   */
  private readonly onCommandSucceeded = (event: CommandSucceededEvent): void => {
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
  private readonly onServerHeartbeatFailed = (event: ServerHeartbeatFailedEvent): void => {
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
  private readonly onServerHeartbeatSucceeded = (event: ServerHeartbeatSucceededEvent): void => {
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
  private readonly onEvent = (event: string): ((meta: unknown) => void) => {
    return (meta: unknown): void => {
      // Stryker disable next-line all
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
   * Remove all the events listeners
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
  /**
   * Check and create the collections indicated in the config
   * @param collections - collections to be created
   */
  private async createCollections(collections: Collections): Promise<void> {
    const actualCollections = (
      await this.client.db().listCollections({}, { nameOnly: true }).toArray()
    ).map(collection => collection.name);
    this.logger.debug(`Collections present in the database: [${actualCollections}]`);
    for (const collection of Object.keys(collections)) {
      if (!actualCollections.includes(collection)) {
        this.logger.debug(`Creating collection: ${collection}`);
        await this.client.db().createCollection(collection, collections[collection].options);
        if (collections[collection].indexes && collections[collection].indexes.length > 0) {
          this.logger.debug(`Creating indexes: ${inspect(collections[collection].indexes)}`);
          await this.client
            .db()
            .collection(collection)
            .createIndexes(collections[collection].indexes);
        }
      } else {
        this.logger.debug(`Collection already exists: ${collection}`);
      }
    }
  }
}

