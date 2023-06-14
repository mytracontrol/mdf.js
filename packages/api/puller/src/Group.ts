import { Bottleneck } from './Bottleneck';
import { BottleneckOptions } from './Bottleneck.interfaces';
import { GROUP_DEFAULTS } from './Group.constants';
import { GroupOptions, Limiter } from './Group.interfaces';
import { IORedisConnection } from './IORedisConnection';
import { Events } from './events/Events';
import { load, overwrite } from './parser/Parser';
import { getAllKeys } from './scripts/Scripts';

export class Group {
  private limiterOptions: BottleneckOptions;
  private instances: Record<string, Bottleneck> = {};
  private events: Events;
  private interval: NodeJS.Timeout;
  private timeout: number;
  private sharedConnection: boolean;
  private connection: IORedisConnection;

  private id: string;

  constructor(limiterOptions: BottleneckOptions = {}) {
    this.limiterOptions = limiterOptions;
    load(this.limiterOptions, GROUP_DEFAULTS, this);

    this.events = new Events(this);
    this._startAutoCleanup();
    this.sharedConnection = this.connection != null;

    if (!this.connection) {
      if (this.limiterOptions.datastore == 'ioredis') {
        this.connection = new IORedisConnection(
          Object.assign({}, this.limiterOptions, { Events: this.events })
        );
      }
    }
  }

  public key(key = ''): Bottleneck {
    if (!this.instances[key]) {
      const groupOptions: GroupOptions = {
        id: `${this.id}-${key}`,
        timeout: this.timeout,
        connection: this.connection,
      };
      const limiter = new Bottleneck(Object.assign(this.limiterOptions, groupOptions));
      this.instances[key] = limiter;
      this.events.trigger('created', limiter, key);
    }
    return this.instances[key];
  }

  public async deleteKey(key = ''): Promise<boolean> {
    let deleted = 0;
    const instance = this.instances[key];
    if (this.connection) {
      deleted = await this.connection.__runCommand__(['del', ...getAllKeys(`${this.id}-${key}`)]);
    }
    if (instance != null) {
      delete this.instances[key];
      await instance.disconnect();
    }
    return instance != null || deleted > 0;
  }

  public limiters(): Limiter[] {
    return Object.keys(this.instances).map(key => ({ key, limiter: this.instances[key] }));
  }

  public keys(): string[] {
    return Object.keys(this.instances);
  }

  public async clusterKeys() {
    if (this.connection == null) {
      return Promise.resolve(this.keys());
    }
    const keys: string[] = [];
    let cursor: number | null = null;
    const start = `b_${this.id}-`.length;
    const end = '_settings'.length;
    while (cursor !== 0) {
      const [next, found] = await this.connection.__runCommand__([
        'scan',
        cursor || 0,
        'match',
        `b_${this.id}-*_settings`,
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

  private async _startAutoCleanup(): Promise<void> {
    clearInterval(this.interval);
    this.interval = setInterval(async () => {
      const time = Date.now();
      for (const [key, instance] of Object.entries(this.instances)) {
        try {
          const result = await instance.store.__groupCheck__(time);
          if (result) {
            this.deleteKey(key);
          }
        } catch (e) {
          this.instances[key].events.trigger('error', e);
        }
      }
    }, this.timeout / 2);

    if (typeof this.interval.unref === 'function') {
      this.interval.unref();
    }
  }

  public updateSettings(options: BottleneckOptions = {}): Promise<void> {
    overwrite(options, GROUP_DEFAULTS, this);
    overwrite(options, options, this.limiterOptions);
    if (options.timeout != null) {
      return this._startAutoCleanup();
    }
    return Promise.resolve();
  }

  public disconnect(flush = true): Promise<any> {
    if (!this.sharedConnection) {
      return this.connection?.disconnect(flush);
    }
    return Promise.resolve();
  }
}
