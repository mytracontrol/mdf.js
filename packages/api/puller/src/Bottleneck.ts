import {
  INSTANCE_DEFAULTS,
  LOCAL_STORE_DEFAULTS,
  NUM_PRIORITIES,
  REDIS_STORE_DEFAULTS,
  STATES_NAMES,
  STOP_DEFAULTS,
  STORE_DEFAULTS,
  STRATEGY,
} from './Bottleneck.constants';
import { BottleneckOptions, ScheduledItem } from './Bottleneck.interfaces';
import { BottleneckError } from './BottleneckError';
import { SubmissionResult } from './DataStores.interfaces';
import { IORedisConnection } from './IORedisConnection';
import { LocalDatastore } from './LocalDatastore';
import { RedisDatastore } from './RedisDatastore';
import { Events } from './events/Events';
import { Job } from './job/Job';
import { JOB_DEFAULTS } from './job/Job.constants';
import { load, overwrite } from './parser/Parser';
import { Queues } from './queues/Queues';
import { States } from './states/States';
import { Sync } from './sync/Sync';

export class Bottleneck {
  private _queues: Queues;
  private _states: States;
  private _store: LocalDatastore | RedisDatastore;
  private _scheduled: Record<string, ScheduledItem>;
  private _limiter: Bottleneck | null;
  private _events: Events;
  private _submitLock: Sync;
  private _registerLock: Sync;
  // Instance options
  private datastore: string;
  private connection: IORedisConnection;
  private id: string;
  private trackDoneStatus: boolean;
  private rejectOnDrop: boolean;
  public on: any;
  public removeAllListeners: any;
  constructor(options: any = {}, ...invalid: any[]) {
    this._validateOptions(options, invalid);
    // TODO: Check
    load(options, INSTANCE_DEFAULTS, this);
    this._queues = new Queues(NUM_PRIORITIES);
    this._scheduled = {};
    this._states = new States(STATES_NAMES.concat(this.trackDoneStatus ? ['DONE'] : []));
    this._limiter = null;
    this._events = new Events(this);
    this._submitLock = new Sync('submit');
    this._registerLock = new Sync('register');
    const storeOptions = load(options, STORE_DEFAULTS, this);
    if (this.datastore == 'ioredis' || this.connection != null) {
      const storeInstanceOptions = load(options, REDIS_STORE_DEFAULTS, this);
      this._store = new RedisDatastore(this, storeOptions, storeInstanceOptions);
    } else if (this.datastore == 'local') {
      const storeInstanceOptions = load(options, LOCAL_STORE_DEFAULTS, this);
      this._store = new LocalDatastore(this, storeOptions, storeInstanceOptions);
    } else {
      throw new BottleneckError(`Invalid datastore type: ${this.datastore}`);
    }
    this._queues.on('leftzero', () => this._store._heartbeat?.ref?.());
    this._queues.on('zero', () => this._store._heartbeat?.unref?.());
  }
  private _validateOptions(options: BottleneckOptions, invalid: any[]): void {
    if (!(options != null && typeof options === 'object' && invalid.length === 0)) {
      throw new BottleneckError('Bottleneck v2 takes a single object argument.');
    }
  }
  public ready(): Promise<any> {
    return this._store._ready;
  }
  public clients(): any {
    return this._store._clients;
  }
  public channel(): string {
    return `b_${this.id}`;
  }
  public channelClient(): string {
    return `b_${this.id}_${this._store._clientId}`;
  }
  public publish(message: any): Promise<any> {
    return this._store.__publish__(message);
  }
  public disconnect(flush = true): Promise<any> {
    return this._store.__disconnect__(flush);
  }
  public chain(_limiter: Bottleneck): Bottleneck {
    this._limiter = _limiter;
    return this;
  }
  public queued(priority?: number): number {
    return this._queues.queued(priority);
  }
  public clusterQueued(): Promise<any> {
    return this._store.__queued__();
  }
  public empty(): boolean {
    return this.queued() === 0 && this._submitLock.isEmpty();
  }
  public running(): Promise<any> {
    return this._store.__running__();
  }
  public done(): Promise<any> {
    return this._store.__done__();
  }
  public jobStatus(id: string): string | null {
    return this._states.jobStatus(id);
  }
  public jobs(status: string): string[] {
    return this._states.statusJobs(status);
  }
  public counts(): Record<string, number> {
    return this._states.statusCounts();
  }
  private _randomIndex(): string {
    return Math.random().toString(36).slice(2);
  }
  public check(weight = 1): Promise<any> {
    return this._store.__check__(weight);
  }
  private _clearGlobalState(index: any): boolean {
    if (this._scheduled[index] != null) {
      clearTimeout(this._scheduled[index].expiration);
      delete this._scheduled[index];
      return true;
    } else {
      return false;
    }
  }
  // TODO: Job param not used, remove?
  private async _free(index: number, job: Job, options: any, eventInfo: any): Promise<void> {
    try {
      // TODO: Check __free__ return values
      const { running } = await this._store.__free__(index, options.weight);
      this._events.trigger('debug', `Freed ${options.id}`, eventInfo);
      if (running === 0 && this.empty()) {
        this._events.trigger('idle');
      }
    } catch (e) {
      this._events.trigger('error', e);
    }
  }
  private _run(index: string, job: Job, wait: number): void {
    job.doRun();
    const clearGlobalState = this._clearGlobalState.bind(this, index);
    // TODO: Check, not all params passed
    const run = this._run.bind(this, index, job);
    const free = this._free.bind(this, index, job);
    this._scheduled[index] = {
      timeout: setTimeout(() => {
        job.doExecute(this._limiter, clearGlobalState, run, free);
      }, wait),
      expiration: job.options.expiration
        ? setTimeout(() => {
            job.doExpire(clearGlobalState, run, free);
          }, wait + job.options.expiration)
        : undefined,
      job: job,
    };
  }
  private async _drainOne(capacity?: number): Promise<number | null> {
    return await this._registerLock.schedule(async () => {
      if (this.queued() === 0) {
        return Promise.resolve(null);
      }
      // TODO: DONE: Added bc getFirst returns DLList or Array
      const queue = this._queues.getFirst();
      if (queue instanceof Array) {
        return Promise.resolve(null);
      }
      const job = queue.first() as Job;
      const options = job.options;
      const args = job.args;
      if (capacity !== undefined && options.weight > capacity) {
        return Promise.resolve(null);
      }
      this._events.trigger('debug', `Draining ${job.options.id}`, { args, options });
      const index = this._randomIndex();
      const { success, wait, reservoir } = await this._store.__register__(
        index,
        options.weight,
        options.expiration as number
      );
      this._events.trigger('debug', `Drained ${options.id}`, {
        success,
        args,
        options,
      });
      if (success) {
        queue.shift();
        const empty = this.empty();
        if (empty) {
          this._events.trigger('empty');
        }
        if (reservoir === 0) {
          this._events.trigger('depleted', empty);
        }
        // TODO: DONE: Wait is a number bc success is true
        this._run(index, queue.first() as Job, wait as number);
        return Promise.resolve(options.weight);
      } else {
        return Promise.resolve(null);
      }
    });
  }
  private async _drainAll(capacity?: number, total = 0): Promise<number> {
    return this._drainOne(capacity)
      .then(drained => {
        if (drained != null) {
          const newCapacity = capacity != undefined ? capacity - drained : capacity;
          return this._drainAll(newCapacity, total + drained);
        } else {
          return Promise.resolve(total);
        }
      })
      .catch(e => {
        return this._events.trigger('error', e);
      });
  }
  private _dropAllQueued(message: any): void {
    this._queues.shiftAll((job: Job) => job.doDrop({ message }));
  }
  private _waitForExecuting(at: number): Promise<void> {
    const finished = () => {
      const counts = this._states.counts;
      return counts[0] + counts[1] + counts[2] + counts[3] === at;
    };
    return new Promise<void>((resolve, reject) => {
      if (finished()) {
        resolve();
      } else {
        this.on('done', () => {
          if (finished()) {
            this.removeAllListeners('done');
            resolve();
          }
        });
      }
    });
  }
  public stop(options: any = {}): void {
    options = load(options, STOP_DEFAULTS);
    // TODO: DONE: waitForExecuting in a separate function
    const done = () => {
      if (options.dropWaitingJobs) {
        this._run = (index, next) => next.doDrop({ message: options.dropErrorMessage });
        this._drainOne = () => Promise.resolve(null);
        // TODO: Check
        this._registerLock.schedule(() => {
          this._submitLock.schedule(() => {
            for (const item of Object.values(this._scheduled)) {
              if (this.jobStatus(item.job.options.id) === 'RUNNING') {
                clearTimeout(item.timeout);
                clearTimeout(item.expiration);
                item.job.doDrop({ message: options.dropErrorMessage });
              }
            }
            this._dropAllQueued(options.dropErrorMessage);
            this._waitForExecuting(0);
          });
        });
      } else {
        this.schedule({ priority: NUM_PRIORITIES - 1, weight: 0 }, () => this._waitForExecuting(1));
      }
      this._receive = job => job._reject(new BottleneckError(options.enqueueErrorMessage));
      this.stop = () => Promise.reject(new BottleneckError('stop() has already been called'));
    };
    return done();
  }
  private async _addToQueue(job: any): Promise<boolean> {
    const { args, options } = job;
    let submitResult: SubmissionResult;
    try {
      submitResult = await this._store.__submit__(this.queued(), options.weight);
    } catch (e) {
      this._events.trigger('debug', `Could not queue ${options.id}`, { args, options, e });
      job.doDrop({ error: e });
      return false;
    }
    if (submitResult.blocked) {
      job.doDrop();
      return true;
    } else if (submitResult.reachedHWM) {
      let shifted;
      // TODO: DONE: Strategies as enum
      if (submitResult.strategy == STRATEGY.LEAK) {
        shifted = this._queues.shiftLastFrom(options.priority);
      } else if (submitResult.strategy == STRATEGY.OVERFLOW_PRIORITY) {
        shifted = this._queues.shiftLastFrom(options.priority + 1);
      } else if (submitResult.strategy == STRATEGY.OVERFLOW) {
        shifted = job;
      }
      if (shifted != null) {
        shifted.doDrop();
      } else if (shifted == null || submitResult.strategy == STRATEGY.OVERFLOW) {
        if (shifted == null) {
          job.doDrop();
        }
        return submitResult.reachedHWM;
      }
    }
    job.doQueue(submitResult.reachedHWM, submitResult.blocked);
    this._queues.push(job);
    await this._drainAll();
    return submitResult.reachedHWM;
  }
  // TODO: Check
  private _receive(job: any): Promise<any> | boolean {
    if (this._states.jobStatus(job.options.id) != null) {
      Promise.reject(
        // job._reject(
        new BottleneckError(`A job with the same id already exists (id=${job.options.id})`)
      );
      return false;
    } else {
      job.doReceive();
      return this._submitLock.schedule(this._addToQueue, job);
    }
  }
  public submit(...args: any[]): void {
    let options, fn, cb;
    if (typeof args[0] == 'function') {
      [fn, ...args] = args;
      cb = args.pop();
      options = load({}, JOB_DEFAULTS);
    } else {
      [options, fn, ...args] = args;
      cb = args.pop();
    }
    const task = (...args) => {
      return new Promise((resolve, reject) => {
        fn(...args, (...args) => {
          if (args[0] != null) {
            reject(args);
          } else {
            resolve(args);
          }
        });
      });
    };
    const job = new Job(
      task,
      args,
      options,
      JOB_DEFAULTS,
      this.rejectOnDrop,
      this._events,
      this._states
    );
    job.promise
      .then(args => cb?.(...args))
      .catch(args => {
        if (Array.isArray(args)) {
          cb?.(...args);
        } else {
          cb?.(args);
        }
      });
    this._receive(job);
  }
  public schedule(...args: any[]): Promise<any> {
    let options, task;
    if (typeof args[0] === 'function') {
      [task, ...args] = args;
      options = {};
    } else {
      [options, task, ...args] = args;
    }
    const job = new Job(
      task,
      args,
      options,
      JOB_DEFAULTS,
      this.rejectOnDrop,
      this._events,
      this._states
    );
    this._receive(job);
    return job.promise;
  }
  public wrap(fn: any): any {
    const schedule = this.schedule.bind(this);
    const wrapped = (...args: any[]): Promise<any> => schedule(fn.bind(this), ...args);
    wrapped.withOptions = (options: any, ...args: any[]): Promise<any> =>
      schedule(options, fn, ...args);
    return wrapped;
  }
  public async updateSettings(options: any): Promise<Bottleneck> {
    const limiterOptions = overwrite(options, STORE_DEFAULTS);
    await this._store.__updateSettings__(limiterOptions);
    overwrite(options, INSTANCE_DEFAULTS, this);
    return this;
  }
  public currentReservoir(): Promise<any> {
    return this._store.__currentReservoir__();
  }
  public incrementReservoir(incr = 0): Promise<any> {
    return this._store.__incrementReservoir__(incr);
  }
  //--------------- GETTERS -------------------
  public get store(): LocalDatastore | RedisDatastore {
    return this._store;
  }
  public get events(): Events {
    return this._events;
  }
}
