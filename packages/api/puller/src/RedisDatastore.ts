import { BottleneckError } from './BottleneckError';
import { RegistrationResult, SubmissionResult } from './DataStores.interfaces';
import { IORedisConnection } from './IORedisConnection';
import { load, overwrite } from './parser/Parser';

export class RedisDatastore {
  private instance: any;
  private storeOptions: any;
  private clientId: number;
  private originalId: any;
  private clients: any;
  private capacityPriorityCounters: any;
  private connection: IORedisConnection;
  private sharedConnection: any;
  private ready: Promise<any>;
  private heartbeat: any;
  private heartbeatInterval: any;
  private timeout: any;
  private clientTimeout: any;

  private clientOptions: any;

  constructor(instance: any, storeOptions: any, storeInstanceOptions: any) {
    this.instance = instance;
    this.clientId = this.instance._randomIndex();

    load(storeInstanceOptions, storeInstanceOptions, this);

    this.clients = {};
    this.capacityPriorityCounters = {};
    this.sharedConnection = this.connection != null;
    this.connection =
      new IORedisConnection({
        clientOptions: this.clientOptions,
        events: this.instance.events,
      }) || null;
    this.instance.connection = this.connection;
    // TODO: Why do we set the value of instance.datastore again if
    // it is checked before (in original)?
    this.instance.datastore = this.connection.datastore;

    this.ready = this.connection._ready
      .then((clients: any) => {
        this.clients = clients;
        return this.runScript('init', this.prepareInitSettings(true));
      })
      .then(() => {
        return this.connection.__addLimiter__(this.instance);
      })
      .then(() => {
        return this.runScript('register_client', [this.instance.queued()]);
      })
      .then(() => {
        this.heartbeat = setInterval(() => {
          return this.runScript('heartbeat', []).catch(e => {
            return this.instance.events.trigger('error', e);
          });
        }, this.heartbeatInterval);

        if (this.heartbeat?.unref) {
          this.heartbeat.unref();
        }
        // TODO: Check. What is returned here?
      });
  }

  async __publish__(message: any): Promise<any> {
    const { client } = await this.ready;
    client.publish(this.instance.channel(), `message:${message.toString()}`);
  }

  async onMessage(channel: any, message: string): Promise<any> {
    try {
      const pos = message.indexOf(':');
      const type = message.slice(0, pos);
      const data = message.slice(pos + 1);
      if (type === 'capacity') {
        // TODO: Check type
        await this.instance._drainAll(data.length > 0 ? parseInt(data) : null);
      } else if (type === 'capacity-priority') {
        const [rawCapacity, priorityClient, counter] = data.split(':');
        const capacity = data.length > 0 ? parseInt(rawCapacity) : null;
        if (priorityClient === `${this.clientId}`) {
          const drained = this.instance._drainAll(capacity);
          const newCapacity = capacity != null ? capacity - (drained || 0) : '';
          await this.instance.client.publish(
            this.instance.channel(),
            `capacity-priority:${newCapacity}:${counter}`
          );
        } else if (priorityClient == '') {
          clearTimeout(this.capacityPriorityCounters[counter]);
          delete this.capacityPriorityCounters[counter];
          this.instance._drainAll(capacity);
        } else {
          this.capacityPriorityCounters[counter] = setTimeout(async () => {
            try {
              delete this.capacityPriorityCounters[counter];
              await this.runScript('blacklist_client', [priorityClient]);
              await this.instance._drainAll(capacity);
            } catch (e) {
              this.instance.events.trigger('error', e);
            }
          }, 1000);
        }
      } else if (type === 'message') {
        this.instance.events.trigger('message', data);
      } else if (type === 'blocked') {
        await this.instance._dropAllQueued();
      }
    } catch (e) {
      this.instance.events.trigger('error', e);
    }
  }

  __disconnect__(flush: any): Promise<any> {
    clearInterval(this.heartbeat);
    if (this.sharedConnection != null) {
      return this.connection.__removeLimiter__(this.instance);
    } else {
      return this.connection.disconnect(flush);
    }
  }

  async runScript(name: string, args: any): Promise<any> {
    if (!(name == 'init' || name == 'register_client')) {
      await this.ready;
    }
    return new Promise((resolve, reject) => {
      const allArgs = [Date.now(), this.clientId, ...args];
      this.instance.events.trigger('debug', `Calling Redis script ${name}.lua`, allArgs);
      const arr = this.connection.__scriptArgs__(
        name,
        this.originalId,
        allArgs,
        (err: any, replies: any) => {
          if (err) {
            return reject(err);
          } else {
            return resolve(replies);
          }
        }
      );
      return this.connection.__scriptFn__(name)(...arr);
    }).catch(e => {
      if (e.message === 'SETTINGS_KEY_NOT_FOUND') {
        if (name === 'heartbeat') {
          return Promise.resolve();
        } else {
          return this.runScript('init', this.prepareInitSettings(false)).then(() => {
            return this.runScript(name, args);
          });
        }
      } else if (e.message === 'UNKNOWN_CLIENT') {
        return this.runScript('register_client', [this.instance.queued()]).then(() => {
          return this.runScript(name, args);
        });
      } else {
        return Promise.reject(e);
      }
    });
  }

  prepareArray(arr: any[]): string[] {
    const results = arr.map((item: any) => {
      return item != null ? item.toString() : '';
    });
    return results;
  }

  prepareObject(obj: any): string[] {
    const results = Object.keys(obj).map((key: any) => {
      if (key != null && obj[key] != null) {
        return obj[key].toString();
      } else {
        return '';
      }
    });
    return results;
  }

  prepareInitSettings(clear: boolean): any[] {
    const initSettings = {
      id: this.originalId,
      version: this.instance.version,
      groupTimeout: this.timeout,
      clientTimeout: this.clientTimeout,
    };
    const allSettings = Object.assign({}, this.storeOptions, initSettings);
    const args = this.prepareObject(allSettings);
    args.unshift(clear ? '1' : '0', this.instance.version);
    return args;
  }

  // TODO: Utils?
  private convertBool(b: any): boolean {
    return !!b;
  }

  async __updateSettings__(options: any): Promise<any> {
    await this.runScript('update_settings', this.prepareObject(options));
    return overwrite(options, options, this.storeOptions);
  }

  __running__(): Promise<any> {
    return this.runScript('running', []);
  }

  __queued__(): Promise<any> {
    return this.runScript('queued', []);
  }

  __done__(): Promise<any> {
    return this.runScript('done', []);
  }

  async __groupCheck__(): Promise<any> {
    const result = await this.runScript('group_check', []);
    return this.convertBool(result);
  }

  __incrementReservoir__(incr: any): Promise<any> {
    return this.runScript('increment_reservoir', [incr]);
  }

  __currentReservoir__(): Promise<any> {
    return this.runScript('current_reservoir', []);
  }

  async __check__(weight: any): Promise<any> {
    const result = await this.runScript('check', this.prepareArray([weight]));
    return result;
  }

  async __register__(
    index: string,
    weight: number,
    expiration: number
  ): Promise<RegistrationResult> {
    const [success, wait, reservoir] = await this.runScript(
      'register',
      this.prepareArray([index, weight, expiration])
    );

    const result: RegistrationResult = {
      success: this.convertBool(success),
      wait: wait,
      reservoir: reservoir,
    };
    return result;
  }

  async __submit__(queueLength: number, weight: number): Promise<SubmissionResult> {
    try {
      const [reachedHWM, blocked, strategy] = await this.runScript(
        'submit',
        this.prepareArray([queueLength, weight])
      );
      const result: SubmissionResult = {
        reachedHWM: this.convertBool(reachedHWM),
        blocked: this.convertBool(blocked),
        strategy: strategy,
      };
      return result;
    } catch (e: any) {
      // TODO: Check e type
      if (e.message === 'OVERWEIGHT') {
        const [overweight, weight, maxConcurrent] = e.message.split(':');
        throw new BottleneckError(
          `Impossible to add a job having a weight of ${weight} to a limiter having a maxConcurrent setting of ${maxConcurrent}`
        );
      } else {
        throw e;
      }
    }
  }

  // TODO: Return type?
  async __free__(index: number, weight: number): Promise<any> {
    const running = await this.runScript('free', this.prepareArray([index]));
    return { running };
  }

  //-------------------- GETTERS --------------------
  public get _ready(): Promise<any> {
    return this.ready;
  }

  public get _clients(): any {
    return this.clients;
  }

  public get _clientId(): number {
    return this.clientId;
  }

  public get _heartbeat(): any {
    return this.heartbeat;
  }
}
