import { Redis } from 'ioredis';
import { Bottleneck } from '../../bottleneck/Bottleneck';
import { BOTTLENECK_VERSION } from '../../bottleneck/Bottleneck.constants';
import { BottleneckError } from '../../bottleneckError/BottleneckError';
import { IORedisConnection } from '../../ioRedisConnection/IORedisConnection';
import { IORedisClients } from '../../ioRedisConnection/IORedisConnection.interfaces';
import { overwrite } from '../../parser/Parser';
import {
  FreeResult,
  RedisStoreOptionsComplete,
  RegistrationResult,
  StoreOptions,
  StoreOptionsComplete,
  SubmissionResult,
} from '../DataStores.interfaces';

export class RedisDatastore {
  private _instance: Bottleneck;
  private _storeOptions: StoreOptionsComplete;

  // Store instance options (Redis)
  private _timeout: number | null;
  private _heartbeatInterval: number;
  private _clientTimeout: number;
  private _client: Redis | null;
  private _clearDatastore: boolean;
  private _connection: IORedisConnection | null;

  private _clientId: string;
  private _originalId: string;
  private _clients: IORedisClients | object;
  private _capacityPriorityCounters: Record<string, NodeJS.Timeout>;
  private _sharedConnection: boolean;
  private _ready: Promise<IORedisClients>;
  private _heartbeat: NodeJS.Timer | undefined;

  // private clientOptions: any;

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
        throw new BottleneckError(
          'Either client or connection must be provided for Redis datastore'
        );
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
            return this._instance.events.trigger('error', e);
          });
        }, this._heartbeatInterval).unref();

        return Promise.resolve(this.clients as IORedisClients);
      });
  }

  public async __publish__(message: any): Promise<number> {
    const clients = await this._ready;
    return clients.client.publish(this._instance.channel(), `message:${message.toString()}`);
  }

  public async onMessage(channel: string, message: string): Promise<number | void> {
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
          return this._instance.drainAll(capacity);
        } else {
          this._capacityPriorityCounters[counter] = setTimeout(async () => {
            try {
              delete this._capacityPriorityCounters[counter];
              await this.runScript('blacklist_client', [priorityClient]);
              return await this._instance.drainAll(capacity);
            } catch (e) {
              return this._instance.events.trigger('error', e);
            }
          }, 1000);
        }
      } else if (type === 'message') {
        this._instance.events.trigger('message', data);
      } else if (type === 'blocked') {
        this._instance.dropAllQueued();
      }
    } catch (e) {
      this._instance.events.trigger('error', e);
    }
  }

  public __disconnect__(flush: boolean): Promise<void | string[]> {
    clearInterval(this.heartbeat!);
    if (this._sharedConnection) {
      return (this._connection as IORedisConnection).__removeLimiter__(this._instance);
    } else {
      return (this._connection as IORedisConnection).disconnect(flush);
    }
  }

  public async runScript(name: string, args: any[]): Promise<any> {
    if (!(name == 'init' || name == 'register_client')) {
      await this.ready;
    }
    return new Promise((resolve, reject) => {
      const allArgs = [Date.now(), this.clientId, ...args];
      this._instance.events.trigger('debug', `Calling Redis script ${name}.lua`, allArgs);
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

  private _prepareArray(arr: any[]): string[] {
    const results = arr.map(item => {
      return item != null ? item.toString() : '';
    });
    return results;
  }

  private _prepareObject(obj: any): string[] {
    const arr: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      arr.push(key);
      arr.push(value != null ? value.toString() : '');
    }
    return arr;
  }

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

  private convertBool(b: any): boolean {
    return !!b;
  }

  public async __updateSettings__(options: StoreOptions): Promise<void> {
    await this.runScript('update_settings', this._prepareObject(options));
    overwrite(options, options, this._storeOptions);
  }

  public __running__(): Promise<any> {
    return this.runScript('running', []);
  }

  public __queued__(): Promise<any> {
    return this.runScript('queued', []);
  }

  public __done__(): Promise<any> {
    return this.runScript('done', []);
  }

  public async __groupCheck__(): Promise<boolean> {
    const result = await this.runScript('group_check', []);
    return this.convertBool(result);
  }

  public __incrementReservoir__(incr: any): Promise<any> {
    return this.runScript('increment_reservoir', [incr]);
  }

  public __currentReservoir__(): Promise<any> {
    return this.runScript('current_reservoir', []);
  }

  public async __check__(weight: any): Promise<any> {
    const result = await this.runScript('check', this._prepareArray([weight]));
    return this.convertBool(result);
  }

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
        throw new BottleneckError(
          `Impossible to add a job having a weight of ${weight} to a limiter having a maxConcurrent setting of ${maxConcurrent}`
        );
      } else {
        throw e;
      }
    }
  }

  public async __free__(index: string, weight: any): Promise<FreeResult> {
    const running = await this.runScript('free', this._prepareArray([index]));
    return { running };
  }

  //-------------------- GETTERS --------------------
  public get ready(): Promise<IORedisClients> {
    return this._ready;
  }

  public get clients(): IORedisClients | object {
    return this._clients;
  }

  public get clientId(): string {
    return this._clientId;
  }

  public get heartbeat(): NodeJS.Timer | undefined {
    return this._heartbeat;
  }
}
