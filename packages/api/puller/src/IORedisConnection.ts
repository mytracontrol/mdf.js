import { Events } from './Events';
import { IORedisConnectionDefaultOptions } from './IORedisConnection.interfaces';
import { getTemplateKeys, getTemplatePayload, names } from './Scripts';
import { load } from './parser';

export class IORedisConnection {
  datastore = 'ioredis';

  private defaults: IORedisConnectionDefaultOptions = {
    client: null,
    subscriber: null,
    events: null,
  };
  private client: any;
  private subscriber: any;
  private events: Events;
  private terminated: boolean;
  private limiters: any;
  private ready: Promise<any>;
  constructor(options: any = {}) {
    load(options, this.defaults, this);

    this.events = new Events(this);
    this.terminated = false;
    this.limiters = {};
    this.ready = Promise.all([
      this._setup(this.client, false),
      this._setup(this.subscriber, true),
    ]).then(() => {
      return this._loadScripts();
    });
  }

  async _setup(client: any, sub: any): Promise<void> {
    client.setMaxListeners(0);
    return new Promise((resolve, reject) => {
      client.on('error', (e: any) => {
        this.events.trigger('error', e);
      });
      if (sub) {
        client.on('message', (channel: any, message: any) => {
          this.limiters[channel]._store.onMessage(channel, message);
        });
      }
      if (client.status == 'ready') resolve();
      else client.once('ready', resolve);
    });
  }
  _loadScripts(): void {
    names.forEach((name: any) => {
      this.client.defineCommand(name, { lua: getTemplatePayload(name) });
    });
  }

  async __runCommand__(cmd: any): Promise<any> {
    await this.ready;
    const [[_, deleted]] = await this.client.pipeline([cmd]).exec();
    return deleted;
  }

  // TODO: Check promises returned
  async __addLimiter__(instance: any): Promise<void[]> {
    const channels = [instance.channel(), instance.channel_client()];
    const promises: Promise<void>[] = channels.map((chanel: any) => {
      return new Promise((resolve, reject) => {
        this.subscriber.subscribe(chanel, () => {
          this.limiters[chanel] = instance;
          resolve();
        });
      });
    });

    const result = await Promise.all(promises);
    return result;
  }

  async __removeLimiter__(instance: any): Promise<void[]> {
    const channels = [instance.channel(), instance.channel_client()];
    const promises: Promise<void>[] = channels.map((chanel: any) => {
      return new Promise((resolve, reject) => {
        this.subscriber.unsubscribe(chanel, () => {
          delete this.limiters[chanel];
          resolve();
        });
      });
    });

    const result = await Promise.all(promises);
    return result;
  }

  __scriptArgs__(name: string, id: string, args: any, cb: any): any {
    const keys = getTemplateKeys(name, id);
    const scriptArgs: (number | string | any)[] = [...[length], ...keys, ...args, ...cb];
    return scriptArgs;
  }

  // TODO: Check
  __scriptFn__(name: string): any {
    return this.client[name].bind(this.client);
  }

  // TODO: Check
  disconnect(flush = true): any {
    Object.keys(this.limiters).forEach((k: any) => {
      clearInterval(this.limiters[k]._store.heartbeat);
    });
    this.limiters = {};
    this.terminated = true;

    if (flush) {
      return Promise.all([this.client.quit(), this.subscriber.quit()]);
    } else {
      this.client.disconnect();
      this.subscriber.disconnect();
      return Promise.resolve();
    }
  }
}
