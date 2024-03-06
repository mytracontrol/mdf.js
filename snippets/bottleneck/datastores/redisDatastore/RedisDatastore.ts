/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Crash } from '@mdf.js/crash';
import { Redis } from 'ioredis';
import {
  FreeResult,
  RedisStoreOptionsComplete,
  RegistrationResult,
  StoreOptions,
  StoreOptionsComplete,
  SubmissionResult,
} from '..';
import { BOTTLENECK_VERSION, Bottleneck } from '../../bottleneck';
import { IORedisClients, IORedisConnection } from '../../ioRedisConnection';
import { overwrite } from '../../parser';

/**
 * Represents a Redis datastore for rate limiting using the Bottleneck library.
 */
export class RedisDatastore {
  /** The instance of Bottleneck associated with the datastore */
  private _instance: Bottleneck;

  // General store options
  /** The complete store options for the datastore */
  private _storeOptions: StoreOptionsComplete;

  // Store instance options (Redis)
  /** The timeout duration for the limiter in the datastore */
  private _timeout: number | null;
  /** The interval for the heartbeat of the datastore in milliseconds */
  private _heartbeatInterval: number;
  /** The timeout duration for a Redis client to be considered valid */
  private _clientTimeout: number;
  /** The Redis client to use for the datastore */
  private _client: Redis | null;
  /** Whether to clear the datastore when the limiter is closed */
  private _clearDatastore: boolean;
  /** The connection to use for the datastore */
  private _connection: IORedisConnection | null;

  /** The client ID associated with the datastore */
  private _clientId: string;
  /** The ID of the instance of Bottleneck associated with the datastore */
  private _originalId: string;
  /** The clients associated with the datastore (client and subscriber) */
  private _clients: IORedisClients | object;
  /** The counters for the capacity priority of the datastore */
  private _capacityPriorityCounters: Record<string, NodeJS.Timeout>;
  /** Whether the datastore is using a shared connection */
  private _sharedConnection: boolean;
  /** A promise that resolves when the datastore is ready for use */
  private _ready: Promise<IORedisClients>;
  /** The timer for the datastore heartbeat, to run Redis heartbeat script*/
  private _heartbeat: NodeJS.Timeout | undefined;

  /**
   * Creates a new instance of the RedisDatastore class.
   * @param instance - The instance of Bottleneck associated with the datastore.
   * @param storeOptions - The complete store options for the datastore.
   * @param storeInstanceOptions - The specific options for the redis store instance.
   */
  constructor(
    instance: Bottleneck,
    storeOptions: StoreOptionsComplete,
    storeInstanceOptions: RedisStoreOptionsComplete
  ) {
    this._instance = instance;
    this._clientId = this._instance.randomIndex();
    this._originalId = this._instance.id;

    // General store options
    this._storeOptions = storeOptions;

    // Load Redis store instance options
    this._timeout = storeInstanceOptions.timeout;
    this._heartbeatInterval = storeInstanceOptions.heartbeatInterval;
    this._clientTimeout = storeInstanceOptions.clientTimeout;
    this._client = storeInstanceOptions.client;
    this._clearDatastore = storeInstanceOptions.clearDatastore;
    this._connection = storeInstanceOptions.connection;

    this._clients = {};
    this._capacityPriorityCounters = {};
    this._sharedConnection = this._connection != null;

    // TODO: DONE: Use client if connection is not provided (at least one of them must be provided)
    if (!this._connection) {
      if (this._client) {
        this._connection = new IORedisConnection({
          client: this._client,
          events: this._instance.events,
        });
      } else {
        throw new Crash('Either client or connection must be provided for Redis datastore');
      }
    }
    this._instance.connection = this._connection;
    this._instance.datastore = this._connection.datastore;

    this._ready = this._connection.ready
      .then((clients: IORedisClients) => {
        this._clients = clients;
        return this.runScript('init', this._prepareInitSettings(this._clearDatastore));
      })
      .then(() => {
        return (this._connection as IORedisConnection).__addLimiter__(this._instance);
      })
      .then(() => {
        return this.runScript('register_client', [this._instance.queued()]);
      })
      .then(() => {
        this._heartbeat = setInterval(() => {
          this.runScript('heartbeat', []).catch((e: Error) => {
            return this._instance.emit('error', e);
          });
        }, this._heartbeatInterval).unref();

        return Promise.resolve(this.clients as IORedisClients);
      });
  }

  /**
   * Publishes a message to the Redis channel associated with the instance.
   * @param message - The message to publish.
   * @returns A promise that resolves with the number of subscribers that received the message.
   */
  public async __publish__(message: any): Promise<number> {
    const clients = await this._ready;
    return clients.client.publish(this._instance.channel(), `message:${message.toString()}`);
  }

  /**
   * Handles incoming messages on the Redis channel.
   * @param channel - The channel on which the message was received.
   * @param message - The received message.
   * @returns A Promise that resolves to the number of processed messages, or void.
   */
  public async onMessage(channel: string, message: string): Promise<number | null> {
    try {
      const pos = message.indexOf(':');
      const type = message.slice(0, pos);
      const data = message.slice(pos + 1);
      if (type === 'capacity') {
        return await this._instance.drainAll(data.length > 0 ? parseInt(data) : null);
      } else if (type === 'capacity-priority') {
        const [rawCapacity, priorityClient, counter] = data.split(':');
        const capacity = data.length > 0 ? parseInt(rawCapacity) : null;
        if (priorityClient === this.clientId) {
          const drained = await this._instance.drainAll(capacity);
          const newCapacity = capacity != null ? capacity - (drained || 0) : '';
          return await (this.clients as IORedisClients).client.publish(
            this._instance.channel(),
            `capacity-priority:${newCapacity}::${counter}`
          );
        } else if (priorityClient == '') {
          clearTimeout(this._capacityPriorityCounters[counter]);
          delete this._capacityPriorityCounters[counter];
          return await this._instance.drainAll(capacity);
        } else {
          this._capacityPriorityCounters[counter] = setTimeout(async () => {
            try {
              delete this._capacityPriorityCounters[counter];
              await this.runScript('blacklist_client', [priorityClient]);
              return await this._instance.drainAll(capacity);
            } catch (e) {
              return this._instance.emit('error', e);
            }
          }, 1000);
        }
      } else if (type === 'message') {
        this._instance.emit('message', data);
      } else if (type === 'blocked') {
        this._instance.dropAllQueued();
      }
      return null;
    } catch (e) {
      this._instance.emit('error', e);
      throw e;
    }
  }

  /**
   * Disconnects from the Redis server.
   * @param flush - Specifies whether to flush pending commands before disconnecting.
   * @returns A Promise that resolves to void or an array of strings representing the replies
   * from the server.
   */
  public __disconnect__(flush: boolean): Promise<void | string[]> {
    clearInterval(this.heartbeat!);
    if (this._sharedConnection) {
      return (this._connection as IORedisConnection).__removeLimiter__(this._instance);
    } else {
      return (this._connection as IORedisConnection).disconnect(flush);
    }
  }

  /**
   * Runs a Redis script with the specified name and arguments.
   * @param name - The name of the Redis script to run.
   * @param args - The arguments to pass to the Redis script.
   * @returns A Promise that resolves to the result of the Redis script execution.
   */
  public async runScript(name: string, args: any[]): Promise<any> {
    if (!(name == 'init' || name == 'register_client')) {
      await this.ready;
    }
    return new Promise((resolve, reject) => {
      const allArgs = [Date.now(), this.clientId, ...args];
      this._instance.emit('debug', `Calling Redis script ${name}.lua`, allArgs);
      const arr = (this._connection as IORedisConnection).__scriptArgs__(
        name,
        this._originalId,
        allArgs,
        (err: Error, replies: any) => {
          if (err) {
            return reject(err);
          } else {
            return resolve(replies);
          }
        }
      );
      return (this._connection as IORedisConnection).__scriptFn__(name)(...arr);
    }).catch(async (e: Error) => {
      if (e.message === 'SETTINGS_KEY_NOT_FOUND') {
        if (name === 'heartbeat') {
          return Promise.resolve();
        } else {
          return this.runScript('init', this._prepareInitSettings(false)).then(() => {
            return this.runScript(name, args);
          });
        }
      } else if (e.message === 'UNKNOWN_CLIENT') {
        return this.runScript('register_client', [this._instance.queued()]).then(() => {
          return this.runScript(name, args);
        });
      } else {
        return Promise.reject(e);
      }
    });
  }

  /**
   * Prepares an array for use in Redis scripts.
   * @param arr - The array to prepare.
   * @returns The prepared array.
   */
  private _prepareArray(arr: any[]): string[] {
    const results = arr.map(item => {
      return item != null ? item.toString() : '';
    });
    return results;
  }

  /**
   * Prepares an object for use in Redis scripts.
   * @param obj - The object to prepare.
   * @returns The prepared object as an array of key-value pairs.
   */
  private _prepareObject(obj: any): string[] {
    const arr: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      arr.push(key);
      arr.push(value != null ? value.toString() : '');
    }
    return arr;
  }

  /**
   * Prepares the initial settings for the Redis store (to be used in init script).
   * @param clear - Indicates whether to clear the datastore.
   * @returns An array of prepared settings.
   */
  private _prepareInitSettings(clear: boolean): any[] {
    const initSettings = {
      id: this._originalId,
      version: BOTTLENECK_VERSION,
      groupTimeout: this._timeout,
      clientTimeout: this._clientTimeout,
    };
    const allSettings = Object.assign({}, this._storeOptions, initSettings);
    const args = this._prepareObject(allSettings);
    args.unshift(clear ? '1' : '0', BOTTLENECK_VERSION);
    return args;
  }

  /**
   * Converts a value to a boolean.
   * @param b - The value to convert.
   * @returns The converted boolean value.
   */
  private convertBool(b: any): boolean {
    return !!b;
  }

  /**
   * Updates the settings of the Redis store.
   * @param options - The new store options.
   * @returns A Promise that resolves when the settings are updated.
   */
  public async __updateSettings__(options: StoreOptions): Promise<void> {
    await this.runScript('update_settings', this._prepareObject(options));
    overwrite(options, options, this._storeOptions);
  }

  /**
   * Retrieves the number of running jobs.
   * @returns A Promise that resolves to the number of running jobs.
   */
  public __running__(): Promise<any> {
    return this.runScript('running', []);
  }

  /**
   * Retrieves the number of queued jobs.
   * @returns A Promise that resolves to the number of queued jobs.
   */
  public __queued__(): Promise<any> {
    return this.runScript('queued', []);
  }

  /**
   * Retrieves the number of completed jobs.
   * @returns A Promise that resolves to the number of completed jobs.
   */
  public __done__(): Promise<any> {
    return this.runScript('done', []);
  }

  /**
   * Checks if the next request on group can be processed.
   * @returns A promise that resolves with a boolean indicating if the next request
   * can be processed.
   */
  public async __groupCheck__(): Promise<boolean> {
    const result = await this.runScript('group_check', []);
    return this.convertBool(result);
  }

  /**
   * Increments the reservoir value.
   * @param incr - The increment value.
   * @returns A Promise that resolves to the updated reservoir value.
   */
  public __incrementReservoir__(incr: any): Promise<any> {
    return this.runScript('increment_reservoir', [incr]);
  }

  /**
   * Retrieves the current reservoir value.
   * @returns A Promise that resolves to the current reservoir value.
   */
  public __currentReservoir__(): Promise<any> {
    return this.runScript('current_reservoir', []);
  }

  /**
   * Checks if a job with the specified weight can be executed.
   * @param weight - The weight of the job.
   * @returns A Promise that resolves to a boolean indicating whether the job can be executed.
   */
  public async __check__(weight: any): Promise<any> {
    const result = await this.runScript('check', this._prepareArray([weight]));
    return this.convertBool(result);
  }

  /**
   * Registers a job with the specified index, weight, and expiration in the limiter.
   * @param index - The index of the job.
   * @param weight - The weight of the request.
   * @param expiration - The expiration time of the job.
   * @returns A promise that resolves with a RegistrationResult object indicating the status
   * of the registration.
   */
  public async __register__(
    index: string,
    weight: number,
    expiration: number
  ): Promise<RegistrationResult> {
    const [success, wait, reservoir] = await this.runScript(
      'register',
      this._prepareArray([index, weight, expiration])
    );

    const result: RegistrationResult = {
      success: this.convertBool(success),
      wait: wait,
      reservoir: reservoir,
    };
    return result;
  }

  /**
   * Submits a job to the limiter if it can be submitted.
   * @param queueLength - The length of the queue in the limiter.
   * @param weight - The weight of the job.
   * @returns A promise that resolves with a SubmissionResult object indicating the status
   * of the submission.
   */
  public async __submit__(queueLength: number, weight: number): Promise<SubmissionResult> {
    try {
      const [reachedHWM, blocked, strategy] = await this.runScript(
        'submit',
        this._prepareArray([queueLength, weight])
      );
      const result: SubmissionResult = {
        reachedHWM: this.convertBool(reachedHWM),
        blocked: this.convertBool(blocked),
        strategy: strategy,
      };
      return result;
    } catch (e) {
      if ((e as Error).message.indexOf('OVERWEIGHT') === 0) {
        const [overweight, weight, maxConcurrent] = (e as Error).message.split(':');
        throw new Crash(
          `Impossible to add a job having a weight of ${weight} to a limiter having a maxConcurrent setting of ${maxConcurrent}`
        );
      } else {
        throw e;
      }
    }
  }

  /**
   * Frees resources associated with a completed job in the limiter.
   * @param index - The index of the completed job.
   * @param weight - The weight of the completed job.
   * @returns A promise that resolves with a FreeResult object indicating the status
   * of freeing the resources.
   */
  public async __free__(index: string, weight: any): Promise<FreeResult> {
    const running = await this.runScript('free', this._prepareArray([index]));
    return { running };
  }

  /*
   * ---------------------------------------------------------------------------------------------
   * GETTERS
   * ---------------------------------------------------------------------------------------------
   */
  /** Gets a promise that resolves when the datastore is ready for use */
  public get ready(): Promise<IORedisClients> {
    return this._ready;
  }
  /** Gets the clients associated with the datastore */
  public get clients(): IORedisClients | object {
    return this._clients;
  }
  /** Gets the client ID associated with the datastore */
  public get clientId(): string {
    return this._clientId;
  }
  /** Gets the timer for the datastore heartbeat, or undefined if the timer is not set */
  public get heartbeat(): NodeJS.Timeout | undefined {
    return this._heartbeat;
  }
}
