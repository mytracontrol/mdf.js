/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import EventEmitter from 'events';
import { merge } from 'lodash';
import { GROUP_DEFAULTS, GroupOptions, GroupOptionsComplete, Limiter } from '.';
import { Bottleneck, BottleneckOptions } from '../bottleneck';
import {
  IORedisConnection,
  IORedisConnectionOptions,
  IO_REDIS_CONNECTION_DEFAULTS,
} from '../ioRedisConnection';
import { overwrite } from '../parser';
import { getAllKeys } from '../scripts';

/**
 * Represents a group of limiters, i.e. Bottleneck instances.
 */
export class Group extends EventEmitter {
  private _limiterOptions: BottleneckOptions;
  private _instances: Record<string, Bottleneck> = {};
  private _interval: NodeJS.Timeout | undefined;
  private _sharedConnection: boolean;

  // Group options
  private _timeout: number;
  private _connection: IORedisConnection;
  private _id: string;

  /**
   * Creates a new Group instance.
   * @param limiterOptions - The options to configure the underlying Bottleneck instances.
   */
  constructor(limiterOptions: BottleneckOptions = {}) {
    super();
    this._limiterOptions = limiterOptions;
    const loadedOptions = merge({}, GROUP_DEFAULTS, this._limiterOptions) as GroupOptionsComplete;
    this._timeout = loadedOptions.timeout;
    this._connection = loadedOptions.connection;
    this._id = loadedOptions.id;

    this._instances = {};
    this._startAutoCleanup();
    this._sharedConnection = this._connection != null;

    if (!this._connection) {
      if (this._limiterOptions.datastore == 'ioredis') {
        const redisConnectionOptions = merge({}, IO_REDIS_CONNECTION_DEFAULTS, {
          ...this._limiterOptions,
          Events: this,
        }) as IORedisConnectionOptions;
        this._connection = new IORedisConnection(redisConnectionOptions);
      }
    }
  }

  // TODO:
  // - It does not check if the key is already in use
  // - It works also for key is ''
  /**
   * Retrieves a Bottleneck instance associated with the specified key.
   *
   * @param key - The key to retrieve the Bottleneck instance for.
   * @returns The Bottleneck instance associated with the key.
   */
  public key(key = ''): Bottleneck {
    if (!this._instances[key]) {
      const groupOptions: GroupOptions = {
        id: `${this._id}-${key}`,
        timeout: this._timeout,
        connection: this._connection,
      };
      const limiter = new Bottleneck(Object.assign(this._limiterOptions, groupOptions));
      this._instances[key] = limiter;
      this.emit('created', limiter, key);
    }
    return this._instances[key];
  }

  /**
   * Deletes the Bottleneck instance associated with the specified key.
   * @param key - The key to delete the Bottleneck instance for.
   * @returns  A promise that resolves to `true` if the Bottleneck instance
   * was deleted, or `false` otherwise.
   */
  public async deleteKey(key = ''): Promise<boolean> {
    let deleted = 0;
    const instance = this._instances[key];
    if (this._connection) {
      deleted = await this._connection.__runCommand__(['del', ...getAllKeys(`${this._id}-${key}`)]);
    }
    if (instance != null) {
      delete this._instances[key];
      await instance.disconnect();
    }
    return instance != null || deleted > 0;
  }

  /**
   * Retrieves an array of Limiter objects representing the key-limiter pairs in the group.
   * @returns An array of Limiter objects.
   */
  public limiters(): Limiter[] {
    return Object.keys(this._instances).map(key => ({ key, limiter: this._instances[key] }));
  }

  /**
   * Retrieves an array of keys associated with the Bottleneck instances in the group.
   * @returns An array of keys.
   */
  public keys(): string[] {
    return Object.keys(this._instances);
  }

  /**
   * Retrieves an array of keys associated with the Bottleneck instances in the group
   *  using cluster mode.
   * @returns A promise that resolves to an array of keys.
   */
  public async clusterKeys(): Promise<string[]> {
    if (this._connection == null) {
      return Promise.resolve(this.keys());
    }
    const keys: string[] = [];
    let cursor: number | null = null;
    const start = `b_${this._id}-`.length;
    const end = '_settings'.length;
    while (cursor !== 0) {
      const [next, found]: any[] = await this._connection.__runCommand__([
        'scan',
        cursor || 0,
        'match',
        `b_${this._id}-*_settings`,
        'count',
        10000,
      ]);
      cursor = ~~next;
      for (const k of found) {
        keys.push(k.slice(start, -end));
      }
    }
    return keys;
  }

  /**
   * Starts the automatic cleanup process for the Group instance.
   * @returns A timer reference or `void`.
   */
  private _startAutoCleanup(): NodeJS.Timeout | void {
    clearInterval(this._interval);
    this._interval = setInterval(async () => {
      const time = Date.now();
      for (const [key, instance] of Object.entries(this._instances)) {
        try {
          const result = await instance.store.__groupCheck__(time);
          if (result) {
            this.deleteKey(key);
          }
        } catch (e) {
          this._instances[key].emit('error', e);
        }
      }
    }, this._timeout / 2);

    if (typeof this._interval.unref === 'function') {
      return this._interval.unref();
    }
  }

  /**
   * Updates the settings of the Group instance.
   * @param options- The options to update the Group settings.
   * @returns A timer reference or `void`.
   */
  public updateSettings(options: BottleneckOptions = {}): NodeJS.Timeout | void {
    const newOptions = overwrite(options, GROUP_DEFAULTS);
    this._timeout = newOptions['timeout'] || this._timeout;
    this._connection = newOptions['connection'] || this._connection;
    this._id = newOptions['id'] || this._id;
    overwrite(options, options, this._limiterOptions);
    if (options.timeout != null) {
      return this._startAutoCleanup();
    }
  }

  // TODO: Return always a promise, not undefined when connection is null (local datastore)
  /**
   * Disconnects the Group instance from the Redis server.
   * @param lush - Whether to flush the Redis database upon disconnection
   * @returns A promise that resolves when the disconnection is complete.
   */
  public disconnect(flush = true): Promise<any> {
    if (!this._sharedConnection && this._connection) {
      return this._connection.disconnect(flush);
    }
    return Promise.resolve();
  }
}
