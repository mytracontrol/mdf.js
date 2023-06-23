import { Redis } from 'ioredis';
import { Bottleneck } from '../bottleneck/Bottleneck';
import { RedisDatastore } from '../datastores/redisDatastore/RedisDatastore';
import { Events } from '../events/Events';
import { load } from '../parser/Parser';
import { getTemplateKeys, getTemplatePayload, names } from '../scripts/Scripts';
import { IO_REDIS_CONNECTION_DEFAULTS } from './IORedisConnection.constants';
import {
  IORedisClients,
  IORedisConnectionOptions,
  IORedisConnectionOptionsComplete,
} from './IORedisConnection.interfaces';

export class IORedisConnection {
  private _datastore = 'ioredis';

  // IO Redis options
  private _options: IORedisConnectionOptionsComplete;
  private _client: Redis | null;
  private _events: Events | null;

  private _subscriber: Redis;
  private _terminated: boolean;
  private _limiters: Record<string, Bottleneck>;
  private _ready: Promise<IORedisClients>;

  // TODO: DONE: Now options is not optional bc Redis client must be passed
  constructor(options: IORedisConnectionOptions) {
    this._options = load(
      options,
      IO_REDIS_CONNECTION_DEFAULTS,
      {}
    ) as IORedisConnectionOptionsComplete;

    this._client = this._options.client;
    // TODO: Should not meet this condition
    if (this._client == null) {
      throw new Error('IORedisConnection: client is required');
    }
    this._subscriber = this._client.duplicate();
    this._events = this._options.events;
    if (this._events == null) {
      this._events = new Events(this);
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

  private async _setup(client: Redis, isSubscriber: boolean): Promise<void> {
    client.setMaxListeners(0);
    return new Promise((resolve, reject) => {
      client.on('error', (e: Error) => {
        (this._events as Events).trigger('error', e);
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

  private _loadScripts(): void {
    names.forEach((name: string) => {
      (this._client as Redis).defineCommand(name, { lua: getTemplatePayload(name) });
    });
  }

  public async __runCommand__(cmd: unknown[]): Promise<any> {
    await this._ready;
    console.log('it is ready');
    // const [[error, deleted]] = await this._client.pipeline([cmd]).exec();
    // return deleted;

    // TODO: Check
    const commandRes = await (this._client as Redis).pipeline([cmd]).exec();
    console.log('commandRes', commandRes);
    if (commandRes == null) {
      return null;
    }
    return commandRes[0][1];
  }

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

  public async __removeLimiter__(instance: Bottleneck): Promise<void> {
    const channels = [instance.channel(), instance.channel_client()];
    channels.forEach(async channel => {
      if (!this._terminated) {
        await this._subscriber.unsubscribe(channel);
      }
      delete this._limiters[channel];
    });
  }

  public __scriptArgs__(name: string, id: string, args: any[], cb: any): any[] {
    const keys = getTemplateKeys(name, id);
    const scriptArgs = [keys.length, ...keys, ...args, cb];
    return scriptArgs;
  }

  public __scriptFn__(name: string): any {
    // TODO: Check
    return (this._client as any)[name].bind(this._client);
  }

  disconnect(flush = true): Promise<string[] | void> {
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

  // ------------------ GETTERS ------------------
  public get ready(): Promise<IORedisClients> {
    return this._ready;
  }

  public get datastore(): string {
    return this._datastore;
  }
}
