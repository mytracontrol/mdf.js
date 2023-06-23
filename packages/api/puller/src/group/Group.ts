import { Bottleneck } from '../bottleneck/Bottleneck';
import { BottleneckOptions } from '../bottleneck/Bottleneck.interfaces';
import { Events } from '../events/Events';
import { IORedisConnection } from '../ioRedisConnection/IORedisConnection';
import { IO_REDIS_CONNECTION_DEFAULTS } from '../ioRedisConnection/IORedisConnection.constants';
import { IORedisConnectionOptions } from '../ioRedisConnection/IORedisConnection.interfaces';
import { load, overwrite } from '../parser/Parser';
import { getAllKeys } from '../scripts/Scripts';
import { GROUP_DEFAULTS } from './Group.constants';
import { GroupOptions, GroupOptionsComplete, Limiter } from './Group.interfaces';

export class Group {
  private _limiterOptions: BottleneckOptions;
  private _instances: Record<string, Bottleneck> = {};
  private _events: Events;
  private _interval: NodeJS.Timeout | undefined;
  private _sharedConnection: boolean;

  // Group options
  private _timeout: number;
  private _connection: IORedisConnection;
  private _id: string;

  // Event listener
  public on: any;
  public once: any;
  public removeAllListeners: any;

  constructor(limiterOptions: BottleneckOptions = {}) {
    this._limiterOptions = limiterOptions;
    const loadedOptions = load(this._limiterOptions, GROUP_DEFAULTS) as GroupOptionsComplete;
    this._timeout = loadedOptions.timeout;
    this._connection = loadedOptions.connection;
    this._id = loadedOptions.id;

    this._events = new Events(this);
    this._instances = {};
    this._startAutoCleanup();
    this._sharedConnection = this._connection != null;

    if (!this._connection) {
      if (this._limiterOptions.datastore == 'ioredis') {
        const redisConnectionOptions = load(
          { ...this._limiterOptions, Events: this._events },
          IO_REDIS_CONNECTION_DEFAULTS
        ) as IORedisConnectionOptions;
        this._connection = new IORedisConnection(redisConnectionOptions);
      }
    }
  }

  // TODO:
  // - It does not check if the key is already in use
  // - It works also for key is ''
  public key(key = ''): Bottleneck {
    if (!this._instances[key]) {
      const groupOptions: GroupOptions = {
        id: `${this._id}-${key}`,
        timeout: this._timeout,
        connection: this._connection,
      };
      const limiter = new Bottleneck(Object.assign(this._limiterOptions, groupOptions));
      this._instances[key] = limiter;
      this._events.trigger('created', limiter, key);
    }
    return this._instances[key];
  }

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

  public limiters(): Limiter[] {
    return Object.keys(this._instances).map(key => ({ key, limiter: this._instances[key] }));
  }

  public keys(): string[] {
    return Object.keys(this._instances);
  }

  public async clusterKeys(): Promise<string[]> {
    if (this._connection == null) {
      return Promise.resolve(this.keys());
    }
    const keys: string[] = [];
    let cursor: number | null = null;
    const start = `b_${this._id}-`.length;
    const end = '_settings'.length;
    while (cursor !== 0) {
      const [next, found] = await this._connection.__runCommand__([
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
          this._instances[key].events.trigger('error', e);
        }
      }
    }, this._timeout / 2);

    if (typeof this._interval.unref === 'function') {
      return this._interval.unref();
    }
  }

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
  public disconnect(flush = true): Promise<any> {
    if (!this._sharedConnection && this._connection) {
      return this._connection.disconnect(flush);
    }
    return Promise.resolve();
  }
}
