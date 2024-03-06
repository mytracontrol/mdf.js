/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import EventEmitter from 'events';
import { Redis } from 'ioredis';
import { merge } from 'lodash';
import {
  IORedisClients,
  IORedisConnectionOptions,
  IORedisConnectionOptionsComplete,
  IO_REDIS_CONNECTION_DEFAULTS,
} from '.';
import { Bottleneck } from '../bottleneck';
import { RedisDatastore } from '../datastores';
import { getTemplateKeys, getTemplatePayload, names } from '../scripts';

/**
 * Represents a connection to a Redis server using the ioredis library.
 */
export class IORedisConnection extends EventEmitter {
  /** The datastore associated with the connection */
  private _datastore = 'ioredis';
  /** The complete options for the IORedisConnection instance */
  private _options: IORedisConnectionOptionsComplete;
  /** The Redis client instance used for executing commands */
  private _client: Redis | null;
  /** The Redis subscriber instance used for listening to messages */
  private _subscriber: Redis;
  /** Indicates whether the connection has been terminated */
  private _terminated: boolean;
  /** The limiters associated with the connection */
  private _limiters: Record<string, Bottleneck>;
  /** A promise that resolves when the connection is ready for use */
  private _ready: Promise<IORedisClients>;
  /** The event emitter for the connection */
  private _events: EventEmitter;

  // TODO: DONE: Now options is not optional bc Redis client must be passed
  /**
   * Creates a new instance of the IORedisConnection class.
   * @param options - The options for the IORedisConnection.
   */
  constructor(options: IORedisConnectionOptions) {
    super();
    this._options = merge(
      {},
      IO_REDIS_CONNECTION_DEFAULTS,
      options
    ) as IORedisConnectionOptionsComplete;

    this._client = this._options.client;
    // TODO: Should not meet this condition
    if (this._client == null) {
      throw new Error('IORedisConnection: client is required');
    }
    this._subscriber = this._client.duplicate();
    if (this._options.events) {
      this._events = this._options.events;
    } else {
      this._events = this;
    }
    this._terminated = false;
    this._limiters = {};
    this._ready = Promise.all([
      this._setup(this._client, false),
      this._setup(this._subscriber, true),
    ]).then(() => {
      this._loadScripts();
      // TODO: DONE: Promise resolved
      const clients: IORedisClients = {
        client: this._client as Redis,
        subscriber: this._subscriber,
      };
      return Promise.resolve(clients);
    });
  }

  /**
   * Sets up the Redis client or subscriber instance with the necessary event listeners.
   * @param client - The Redis client or subscriber instance.
   * @param isSubscriber - Indicates whether the instance is a subscriber.
   * @returns A promise that resolves when the instance is ready.
   */
  private async _setup(client: Redis, isSubscriber: boolean): Promise<void> {
    client.setMaxListeners(0);
    return new Promise((resolve, reject) => {
      client.on('error', (e: Error) => {
        this._events.emit('error', e);
      });
      if (isSubscriber) {
        client.on('message', (channel: string, message: string) => {
          (this._limiters[channel].store as RedisDatastore).onMessage(channel, message);
        });
      }

      if (client.status == 'ready') {
        resolve();
      } else {
        client.once('ready', resolve);
      }
    });
  }

  /**
   * Loads the Lua scripts associated with the IORedisConnection instance.
   */
  private _loadScripts(): void {
    names.forEach((name: string) => {
      (this._client as Redis).defineCommand(name, { lua: getTemplatePayload(name) });
    });
  }

  /**
   * Executes a Redis command through the connection.
   * @param cmd - The Redis command to execute.
   * @returns A promise that resolves with the result of the command.
   */
  public async __runCommand__(cmd: unknown[]): Promise<any> {
    await this._ready;
    console.log('it is ready');
    // const [[error, deleted]] = await this._client.pipeline([cmd]).exec();
    // return deleted;

    // TODO: Check
    const commandRes = await (this._client as Redis).pipeline([cmd]).exec();
    if (commandRes == null) {
      return null;
    }
    return commandRes[0][1];
  }

  /**
   * Adds a limiter instance to the connection for rate limiting.
   * @param instance - The Bottleneck instance to add as a limiter.
   * @returns An array of promises that resolve when the limiter is added.
   */
  public async __addLimiter__(instance: Bottleneck): Promise<void[]> {
    const channels = [instance.channel(), instance.channel_client()];
    const promises = channels.map((chanel: string) => {
      return new Promise<void>((resolve, reject) => {
        this._subscriber.subscribe(chanel, () => {
          this._limiters[chanel] = instance;
          resolve();
        });
      });
    });

    return Promise.all(promises);
  }

  /**
   * Removes a limiter instance from the connection.
   * @param instance - The Bottleneck instance to remove as a limiter.
   * @returns A promise that resolves when the limiter is removed.
   */
  public async __removeLimiter__(instance: Bottleneck): Promise<void> {
    const channels = [instance.channel(), instance.channel_client()];
    channels.forEach(async channel => {
      if (!this._terminated) {
        await this._subscriber.unsubscribe(channel);
      }
      delete this._limiters[channel];
    });
  }

  /**
   * Formats the arguments for a Lua script execution.
   * @param name - The name of the Lua script.
   * @param id - The identifier of the limiter.
   * @param args - The arguments for the script.
   * @param cb - The callback function to execute within the script.
   * @returns An array of formatted script arguments.
   */
  public __scriptArgs__(name: string, id: string, args: any[], cb: any): any[] {
    const keys = getTemplateKeys(name, id);
    const scriptArgs = [keys.length, ...keys, ...args, cb];
    return scriptArgs;
  }

  /**
   * Retrieves a bound function for executing a Redis command by name.
   * @param name - The name of the Redis command.
   * @returns The bound function for executing the Redis command.
   */
  public __scriptFn__(name: string): any {
    // TODO: Check
    return (this._client as any)[name].bind(this._client);
  }

  /**
   * Disconnects from the Redis server.
   * @param flush - Indicates whether to flush pending commands before
   * disconnecting (default: true).
   * @returns A promise that resolves when the disconnection is complete.
   */
  public disconnect(flush = true): Promise<string[] | void> {
    Object.values(this._limiters).forEach(limiter => {
      clearInterval(limiter.store.heartbeat);
    });
    this._limiters = {};
    this._terminated = true;

    if (flush) {
      return Promise.all([(this._client as Redis).quit(), this._subscriber.quit()]);
    } else {
      (this._client as Redis).disconnect();
      this._subscriber.disconnect();
      return Promise.resolve();
    }
  }

  /*
   * ---------------------------------------------------------------------------------------------
   * GETTERS
   * ---------------------------------------------------------------------------------------------
   */
  /** Gets a promise that resolves when the connection is ready for use */
  public get ready(): Promise<IORedisClients> {
    return this._ready;
  }
  /** Gets the datastore associated with the connection */
  public get datastore(): string {
    return this._datastore;
  }
}
