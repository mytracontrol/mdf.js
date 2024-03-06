/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Crash } from '@mdf.js/crash';
import {
  BottleneckOptions,
  INSTANCE_DEFAULTS,
  InstanceOptionsComplete,
  STOP_DEFAULTS,
  STRATEGY,
  ScheduledItem,
} from '.';
import {
  LOCAL_STORE_DEFAULTS,
  LocalDatastore,
  LocalStoreOptionsComplete,
  REDIS_STORE_DEFAULTS,
  RedisDatastore,
  RedisStoreOptionsComplete,
  RegistrationResult,
  STORE_DEFAULTS,
  StoreOptionsComplete,
  SubmissionResult,
} from '../datastores';
import { DLList } from '../dlList';
import { IORedisClients, IORedisConnection } from '../ioRedisConnection';
import { overwrite } from '../parser';
import { Queues } from '../queues';
import { Sync } from '../sync';
import { Job } from './Job';
import { States } from './States';

import EventEmitter from 'events';
import { merge } from 'lodash';
import {
  EVENTS,
  EventInfo,
  EventInfoDropped,
  EventInfoQueued,
  EventInfoRetryable,
  JobOptions,
  JobState,
  MAX_PRIORITY,
  NUMBER_OF_QUEUES,
  StopOptions,
  TaskArguments,
  TaskAsCallback,
  TaskAsPromise,
  TaskCallback,
} from './types';

export interface Bottleneck {
  /** Emitted when an error occurs */
  on(event: EVENTS.ERROR, listener: (error: Error | Crash) => void): this;
  /** Emitted when an error occurs */
  once(event: EVENTS.ERROR, listener: (error: Crash) => void): this;
  /** Emitted when the limiter is empty */
  on(event: EVENTS.EMPTY, listener: () => void): this;
  /** Emitted when the limiter is empty */
  once(event: EVENTS.EMPTY, listener: () => void): this;
  /** Emitted when the limiter is empty and there are no jobs running */
  on(event: EVENTS.IDLE, listener: () => void): this;
  /** Emitted when the limiter is empty and there are no jobs running */
  once(event: EVENTS.IDLE, listener: () => void): this;
  /**
   * Emitted every time the reservoir is drops to zero, `empty` argument is `true` if the limiter is
   * empty
   */
  on(event: EVENTS.DEPLETED, listener: (empty: boolean) => void): this;
  /**
   * Emitted every time the reservoir is drops to zero, `empty` argument is `true` if the limiter is
   * empty
   */
  once(event: EVENTS.DEPLETED, listener: (empty: boolean) => void): this;
  /** Emitted when a message is received */
  on(event: EVENTS.MESSAGE, listener: (message: string) => void): this;
  /** Emitted when a message is received */
  once(event: EVENTS.MESSAGE, listener: (message: string) => void): this;
  /** Emitted when a debug message is received */
  on(event: EVENTS.DEBUG, listener: (message: string, info: any) => void): this;
  /** Emitted when a debug message is received */
  once(event: EVENTS.DEBUG, listener: (message: string, info: any) => void): this;
  /** Emitted when a strategy is used to drop a job. The dropped job is passed to the callback */
  on(event: EVENTS.DROPPED, listener: (dropped: EventInfoDropped) => void): this;
  /** Emitted when a strategy is used to drop a job. The dropped job is passed to the callback */
  once(event: EVENTS.DROPPED, listener: (dropped: EventInfoDropped) => void): this;
  /** Emitted when a job is received */
  on(event: EVENTS.RECEIVED, listener: (info: EventInfo) => void): this;
  /** Emitted when a job is received */
  once(event: EVENTS.RECEIVED, listener: (info: EventInfo) => void): this;
  /** Emitted when a job is queued */
  on(event: EVENTS.QUEUED, listener: (info: EventInfoQueued) => void): this;
  /** Emitted when a job is queued */
  once(event: EVENTS.QUEUED, listener: (info: EventInfoQueued) => void): this;
  /** Emitted when a job is scheduled */
  on(event: EVENTS.SCHEDULED, listener: (info: EventInfo) => void): this;
  /** Emitted when a job is scheduled */
  once(event: EVENTS.SCHEDULED, listener: (info: EventInfo) => void): this;
  /** Emitted when a job is executing */
  on(event: EVENTS.EXECUTING, listener: (info: EventInfoRetryable) => void): this;
  /** Emitted when a job is executing */
  once(event: EVENTS.EXECUTING, listener: (info: EventInfoRetryable) => void): this;
  /** Emitted when a job is done */
  on(event: EVENTS.DONE, listener: (info: EventInfoRetryable) => void): this;
  /** Emitted when a job is done */
  once(event: EVENTS.DONE, listener: (info: EventInfoRetryable) => void): this;
  /** Emitted when a job is retried */
  on(event: EVENTS.RETRY, listener: (message: string, info: EventInfoRetryable) => void): this;
  /** Emitted when a job is retried */
  once(event: EVENTS.RETRY, listener: (message: string, info: EventInfoRetryable) => void): this;
  /**
   * Emitted when a job fails, if the job should be retried, the callback must be called with the
   * time to wait before retrying, if `null` is passed, the job is dropped
   */
  on(
    event: EVENTS.FAILED,
    listener: (
      error: Crash | Error,
      info: EventInfoRetryable,
      callback: (time?: number) => void
    ) => void
  ): this;
  /**
   * Emitted when a job fails, if the job should be retried, the callback must be called with the
   * time to wait before retrying, if `null` is passed, the job is dropped
   */
  once(
    event: EVENTS.FAILED,
    listener: (
      error: Crash | Error,
      info: EventInfoRetryable,
      callback: (time?: number) => void
    ) => void
  ): this;
}

export class Bottleneck extends EventEmitter {
  /** The Queues instance to maintain queues of jobs by priority */
  private _queues: Queues;
  /** The States instance to manage jobs states */
  private _states: States;
  /** The Store instance to store jobs and limiter state */
  private _store: LocalDatastore | RedisDatastore;
  /** The list of scheduled jobs */
  private readonly scheduledJobsMap: Map<string, ScheduledItem> = new Map();
  /** A chained limiter */
  private chainedLimiter?: Bottleneck;
  /** The Sync instance to handle concurrency on submit*/
  private _submitLock: Sync;
  /** The Sync instance to handle concurrency on register*/
  private _registerLock: Sync;

  // Instance options
  /** Bottleneck limiter complete options */
  private _bottleneckOptions: InstanceOptionsComplete;
  /** Datastore where to store limiter internal state */
  public datastore: string;
  /** Redis connection to be used by the limiter when having Redis datastore */
  public connection: IORedisConnection | null;
  /** The id of the limiter */
  private _id: string;
  /** Whether to reject the promise when the job is dropped */
  private _rejectOnDrop: boolean;
  /** Whether to track the done status of jobs */
  private _trackDoneStatus: boolean;
  /**
   * Creates an instance of Bottleneck.
   * @param options - The options for the bottleneck instance.
   */
  constructor(options: BottleneckOptions = {}) {
    super();
    this._addToQueue = this._addToQueue.bind(this);

    /** Load instance options */
    this._bottleneckOptions = merge({}, INSTANCE_DEFAULTS, options) as InstanceOptionsComplete;
    this.datastore = this._bottleneckOptions.datastore;
    this.connection = this._bottleneckOptions.connection;
    this._id = this._bottleneckOptions.id;
    this._rejectOnDrop = this._bottleneckOptions.rejectOnDrop;
    this._trackDoneStatus = this._bottleneckOptions.trackDoneStatus;

    this._queues = new Queues(NUMBER_OF_QUEUES);
    this._states = new States(this._trackDoneStatus);
    this._submitLock = new Sync('submit');
    this._registerLock = new Sync('register');

    const storeOptions = merge({}, STORE_DEFAULTS, options) as StoreOptionsComplete;
    if (this.datastore == 'ioredis' || this.connection != null) {
      const storeInstanceOptions = merge(
        {},
        REDIS_STORE_DEFAULTS,
        options
      ) as RedisStoreOptionsComplete;
      this._store = new RedisDatastore(this, storeOptions, storeInstanceOptions);
    } else if (this.datastore == 'local') {
      const storeInstanceOptions = merge(
        {},
        LOCAL_STORE_DEFAULTS,
        options
      ) as LocalStoreOptionsComplete;
      this._store = new LocalDatastore(this, storeOptions, storeInstanceOptions);
    } else {
      throw new Crash(`Invalid datastore type: ${this.datastore}`);
    }

    this._queues.on('leftzero', () => this._store.heartbeat?.ref?.());
    this._queues.on('zero', () => this._store.heartbeat?.unref?.());
  }
  /**
   * Returns a promise that resolves when the datastore is ready.
   * @returns A promise that resolves with void or IORedisClients.
   */
  public ready(): Promise<void | IORedisClients> {
    return this._store.ready;
  }
  /**
   * Returns the clients of the datastore.
   * @returns The clients of the datastore.
   */
  public clients(): object | IORedisClients {
    return this._store.clients;
  }
  /**
   * Returns the channel name for the bottleneck instance.
   * @returns The channel name for the bottleneck instance.
   */
  public channel(): string {
    return `b_${this.id}`;
  }
  /**
   * Returns the channel client name for the bottleneck instance.
   * @returns The channel client name for the bottleneck instance.
   */
  public channel_client(): string {
    return `b_${this.id}_${this._store.clientId}`;
  }
  /**
   * Publishes a message to the bottleneck instance's channel.
   * @param message - The message to publish.
   * @returns A promise that resolves when the message is published.
   */
  public publish(message: string): Promise<void | number> {
    return this._store.__publish__(message);
  }
  /**
   * Disconnects the bottleneck instance from the datastore
   * @param flush - Specifies whether to flush the datastore before disconnecting.
   * @returns A promise that resolves when the disconnect operation is complete.
   */
  public disconnect(flush = true): Promise<void | string[]> {
    return this._store.__disconnect__(flush);
  }
  /**
   * Chains the current bottleneck instance with another instance.
   * @param limiter - The bottleneck instance to chain with.
   * @returns The chained bottleneck instance.
   */
  public chain(limiter: Bottleneck): Bottleneck {
    this.chainedLimiter = limiter;
    return this;
  }
  /**
   * Returns the number of jobs currently queued with the specified priority.
   * @param priority - The priority level.
   * @returns The number of jobs currently queued with the specified priority.
   */
  public queued(priority?: number): number {
    return this._queues.queued(priority);
  }
  /**
   * Returns a promise that resolves with the number of queued jobs in the cluster.
   * @returns A promise that resolves with the number of queued jobs in the cluster.
   */
  public clusterQueued(): Promise<any> {
    return this._store.__queued__();
  }
  /**
   * Checks whether the bottleneck instance is empty (i.e., no queued jobs or jobs being executed).
   * @returns A boolean indicating whether the bottleneck instance is empty.
   */
  public empty(): boolean {
    return this.queued() === 0 && this._submitLock.isEmpty();
  }
  /**
   * Returns a promise that resolves with the number of jobs running.
   * @returns A promise that resolves with the number of jobs running.
   */
  public running(): Promise<any> {
    return this._store.__running__();
  }
  /**
   * Returns a promise that resolves with the number of jobs done.
   * @returns A promise that resolves with the number of jobs done.
   */
  public done(): Promise<any> {
    return this._store.__done__();
  }
  /**
   * Returns the status of a job with the specified ID.
   * @param id - The ID of the job.
   * @returns The status of the job with the specified ID.
   */
  public jobStatus(id: string): string | null {
    return this._states.jobStatus(id);
  }
  /**
   * Returns an array of job IDs with the specified status.
   * @param status - The status of the jobs to retrieve.
   * @returns An array of job IDs with the specified status.
   */
  public jobs(status: JobState): string[] {
    return this._states.statusJobs(status);
  }
  /**
   * Returns a record containing the counts of jobs for each status.
   * @returns A record containing the counts of jobs for each status.
   */
  public counts(): Record<string, number> {
    return this._states.statusCounts();
  }
  /**
   * Generates a random index string.
   * @returns A random index string.
   */
  public randomIndex(): string {
    return Math.random().toString(36).slice(2);
  }
  /**
   * Checks the availability of the bottleneck instance.
   * @param weight - The weight of the check operation.
   * @returns A promise that resolves when the check is complete.
   */
  public check(weight = 1): Promise<any> {
    return this._store.__check__(weight);
  }
  /**
   * Clears a job from the global state of the Bottleneck class by deleting it from scheduled jobs.
   * @param index - The index of the job to clear.
   */
  private _clearGlobalState(index: string): boolean {
    const scheduledItem = this.scheduledJobsMap.get(index);
    if (scheduledItem) {
      clearTimeout(scheduledItem.expiration);
    }
    return this.scheduledJobsMap.delete(index);
  }
  /**
   * Free a job from the bottleneck instance.
   * @param index - The index of the job to free.
   * @param job - The job to free.
   * @param options - The options for the free operation.
   * @param eventInfo - The event info for the free operation.
   */
  private async _free(index: string, job: Job, options: any, eventInfo: any): Promise<void> {
    try {
      const freeResult = await this._store.__free__(index, options.weight);
      this.emit('debug', `Freed ${options.id}`, eventInfo);
      if (freeResult.running === 0 && this.empty()) {
        this.emit('idle');
      }
    } catch (rawError) {
      const error = Crash.from(rawError);
      this.emit('error', error);
    }
  }
  /**
   * Run a job in the bottleneck instance.
   * @param index - The index of the job to run.
   * @param job - The job to run.
   * @param wait - The wait time for running the job.
   */
  private _run(index: string, job: Job, wait: number): void {
    job.doRun();
    const clearGlobalState = this._clearGlobalState.bind(this, index);
    const run = this._run.bind(this, index, job, wait);
    const free = this._free.bind(this, index, job);
    const timeout = setTimeout(() => {
      job.doExecute(clearGlobalState, run, free, this.chainedLimiter);
    }, wait);
    const expiration = job.options.expiration
      ? setTimeout(() => {
          job.doExpire(clearGlobalState, run, free);
        }, wait + job.options.expiration)
      : undefined;
    this.scheduledJobsMap.set(index, { timeout, expiration, job });
  }
  /**
   * Drains a single job from the queue, if available, and processes it.
   * @param capacity - The capacity limit for draining jobs.
   * @returns A promise that resolves with the weight of the drained job,
   * or `null` if no job was drained.
   */
  private async _drainOne(capacity: number | null = null): Promise<number | null> {
    return await this._registerLock.schedule(async () => {
      if (this.queued() === 0) {
        return Promise.resolve(null);
      }
      const queue = this._queues.getFirst() as DLList<Job>;
      const job = queue.first() as Job;
      const options = job.options;
      const args = job.args;
      if (capacity !== null && options.weight > capacity) {
        return Promise.resolve(null);
      }

      this.emit('debug', `Draining ${job.options.id}`, { args, options });
      const index = this.randomIndex();
      return this._store
        .__register__(index, options.weight, options.expiration as number)
        .then((result: RegistrationResult) => {
          this.emit('debug', `Drained ${options.id}`, {
            success: result.success,
            args,
            options,
          });

          if (result.success) {
            queue.shift();
            const empty = this.empty();
            if (empty) {
              this.emit('empty');
            }
            if (result.reservoir === 0) {
              this.emit('depleted', empty);
            }
            // TODO: DONE: Wait is a number bc success is true
            this._run(index, job, result.wait as number);
            return Promise.resolve(options.weight);
          } else {
            return Promise.resolve(null);
          }
        });
    });
  }
  /**
   * Drains all jobs from the queue, if available, and processes them.
   * @param capacity - The capacity limit for draining jobs.
   * @param total - The total weight of the drained jobs.
   * @returns A promise that resolves with the total weight of the drained jobs.
   */
  public async drainAll(capacity: number | null = null, total = 0): Promise<number | null> {
    try {
      const drained = await this._drainOne(capacity);
      if (drained != null) {
        const newCapacity = capacity != null ? capacity - drained : capacity;
        return this.drainAll(newCapacity, total + drained);
      } else {
        return total;
      }
    } catch (rawError) {
      const error = Crash.from(rawError);
      this.emit('error', error);
      throw error;
    }
  }
  /**
   * Drop all queued jobs in the limiter (bottleneck instance).
   * @param message - The message for the error thrown when dropping the jobs.
   */
  public dropAllQueued(message?: string): void {
    this._queues.shiftAll((job: Job) => {
      job.doDrop({ message });
    });
  }
  /**
   * Waits for jobs in the limiter to finish.
   * @param at - The number of jobs to wait for.
   * @returns A promise that resolves when the jobs are finished.
   */
  private _waitForExecuting = (at: number): Promise<void> => {
    const finished = () => {
      const counts = this._states.counts;
      return counts[0] + counts[1] + counts[2] + counts[3] === at;
    };
    return new Promise<void>(resolve => {
      if (finished()) {
        resolve();
      } else {
        this.on(EVENTS.DONE, () => {
          if (finished()) {
            this.removeAllListeners('done');
            resolve();
          }
        });
      }
    });
  };
  /**
   * Stops the limiter
   * @param options - The options for stopping the limiter.
   * @returns A promise that resolves when the limiter is stopped.
   */
  public stop(options: StopOptions = {}): Promise<void> {
    options = merge({}, STOP_DEFAULTS, options);
    // const done = () => {
    const done: Promise<void> = options.dropWaitingJobs
      ? // if (options.dropWaitingJobs) {
        (() => {
          this._run = (index, next) => next.doDrop({ message: options.dropErrorMessage });
          this._drainOne = () => Promise.resolve(null);
          // TODO: Check
          return this._registerLock.schedule(() => {
            return this._submitLock.schedule(() => {
              for (const item of this.scheduledJobsMap.values()) {
                if (this.jobStatus(item.job.options.id) === 'RUNNING') {
                  clearTimeout(item.timeout);
                  clearTimeout(item.expiration);
                  item.job.doDrop({ message: options.dropErrorMessage });
                }
              }
              this.dropAllQueued(options.dropErrorMessage);
              return this._waitForExecuting(0);
            });
          });
        })()
      : this.schedule({ priority: MAX_PRIORITY, weight: 0 }, () => {
          return this._waitForExecuting(1);
        });
    this._receive = async job =>
      job.reject(new Crash(options.enqueueErrorMessage || 'stop() has already been called'));
    this.stop = () => Promise.reject(new Crash('stop() has already been called'));
    return done;
  }
  /**
   * Adds a job to the limiter's queue
   * @param job - The job to add to the limiter's queue.
   * @returns A promise that resolves when the job is queued indicating if high-water
   * mark is reached.
   */
  private async _addToQueue(job: Job): Promise<boolean> {
    const { args, options } = job;
    let submitResult: SubmissionResult;
    try {
      submitResult = await this._store.__submit__(this.queued(), options.weight);
    } catch (e) {
      this.emit('debug', `Could not queue ${options.id}`, { args, options, e });
      job.doDrop({ error: e as Error });
      return false;
    }
    if (submitResult.blocked) {
      job.doDrop();
      return true;
    } else if (submitResult.reachedHWM) {
      let shifted: Job | null = null;
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
    await this.drainAll();
    return submitResult.reachedHWM;
  }
  /**
   * Receives a job and adds it to the limiter's queue
   * @param job - The job received to add to the limiter's queue.
   * @returns A promise that resolves when the job is queued.
   */
  private _receive(job: Job): Promise<any> | boolean {
    if (this._states.jobStatus(job.options.id) != null) {
      job.reject(new Crash(`A job with the same id already exists (id=${job.options.id})`));
      return false;
    } else {
      job.doReceive();
      return this._submitLock.schedule(this._addToQueue, job);
    }
  }
  /**
   * Submits a job to be executed by the limiter adding it to the queue.
   * This is the callback version of schedule().
   * @param options - Job options
   * @param task - The task to add to the limiter's queue.
   * @param args - The arguments for the task.
   */
  public submit<R>(
    options: JobOptions,
    task: TaskAsCallback<R>,
    ...args: [...TaskArguments, TaskCallback<R>]
  ): void;
  /**
   * Submits a job to be executed by the limiter adding it to the queue.
   * This is the callback version of schedule().
   * @param task - The task to add to the limiter's queue.
   * @param args - The arguments for the task.
   */
  public submit<R>(task: TaskAsCallback<R>, ...args: [...TaskArguments, TaskCallback<R>]): void;
  public submit<R>(...args: TaskArguments): void {
    let options: JobOptions | undefined = undefined;
    let task: TaskAsCallback<R>;
    if (typeof args[0] === 'object' && !(args[0] instanceof Function)) {
      options = args[0];
      task = args[1];
    } else {
      task = args[0];
    }
    const callback: TaskCallback<R> = args.pop();
    const taskArgs: TaskArguments = args.slice(1, args.length - 1);

    const wrappedTask = (...args: TaskArguments): Promise<R> => {
      return new Promise<R>((resolve, reject) => {
        task(...args, (error: Crash | Error | null, result?: R) => {
          if (error) {
            reject(Crash.from(error));
          } else {
            resolve(result as R);
          }
        });
      });
    };

    const job = new Job(
      wrappedTask,
      taskArgs,
      options || {},
      this._rejectOnDrop,
      this,
      this._states
    );
    job.promise
      .then((result: R) => callback(null, result))
      .catch((error: Crash) => {
        callback(error);
      });
    this._receive(job);
  }
  /**
   * Schedules a job to be executed by the limiter adding it to the queue.
   * @param options - Job options
   * @param task - The task to add to the limiter's queue.
   * @param args - The arguments for the task.
   */
  public schedule<R>(
    options: JobOptions,
    task: TaskAsPromise<R>,
    ...args: TaskArguments
  ): Promise<R>;
  /**
   * Schedules a job to be executed by the limiter adding it to the queue.
   * @param task - The task to add to the limiter's queue.
   * @param args - The arguments for the task.
   */
  public schedule<R>(task: TaskAsPromise<R>, ...args: TaskArguments): Promise<R>;
  public schedule<R>(...args: TaskArguments): Promise<R> {
    let options: JobOptions | undefined = undefined;
    let task: TaskAsPromise<R>;
    let taskArgs: TaskArguments;

    if (typeof args[0] === 'object' && !(args[0] instanceof Function)) {
      options = args[0];
      task = args[1];
      taskArgs = args.slice(2);
    } else {
      task = args[0];
      taskArgs = args.slice(1);
    }
    const job = new Job(task, taskArgs, options || {}, this._rejectOnDrop, this, this._states);
    this._receive(job);
    return job.promise;
  }
  /**
   * Wraps a function to be executed by the limiter so that it is rate limited
   * @param fn - The function to wrap.
   * @returns A wrapped function identical to the original, but rate limited.
   */
  public wrap<R>(fn: TaskAsPromise<R>): TaskAsPromise<R> & { withOptions: TaskAsPromise<R> } {
    const schedule = this.schedule.bind(this);
    const wrapped = (...args: TaskArguments): Promise<R> => schedule(fn.bind(this), ...args);
    wrapped.withOptions = (options: JobOptions, ...args: TaskArguments): Promise<R> =>
      schedule(options, fn, ...args);
    return wrapped;
  }
  /**
   * Updates the settings of the limiter.
   * @param options - The new settings to apply.
   * @returns A promise that resolves when the settings are updated.
   */
  public async updateSettings(options: BottleneckOptions): Promise<Bottleneck> {
    const limiterOptions = overwrite(options, STORE_DEFAULTS);
    await this._store.__updateSettings__(limiterOptions);
    const newInstanceOptions = overwrite(options, INSTANCE_DEFAULTS);
    if (newInstanceOptions['datastore'] !== undefined) {
      this.datastore = newInstanceOptions['datastore'];
    }
    if (newInstanceOptions['connection'] !== undefined) {
      this.connection = newInstanceOptions['connection'];
    }
    if (newInstanceOptions['id'] !== undefined) {
      this._id = newInstanceOptions['id'];
    }
    if (newInstanceOptions['rejectOnDrop'] !== undefined) {
      this._rejectOnDrop = newInstanceOptions['rejectOnDrop'];
    }
    if (newInstanceOptions['trackDoneStatus'] !== undefined) {
      this._trackDoneStatus = newInstanceOptions['trackDoneStatus'];
    }

    return this;
  }
  /**
   * Retrieves the current reservoir value.
   * @returns A promise that resolves with the current reservoir value.
   */
  public currentReservoir(): Promise<number | null> {
    return this._store.__currentReservoir__();
  }
  /**
   * Adds to the reservoir count and returns the new value
   * @param incrementBy - The amount to increment the reservoir by.
   * @returns A promise that resolves with the new reservoir value.
   */
  public incrementReservoir(incrementBy = 0): Promise<number> {
    return this._store.__incrementReservoir__(incrementBy);
  }
  /*
   * ---------------------------------------------------------------------------------------------
   * GETTERS
   * ---------------------------------------------------------------------------------------------
   */
  /** Gets the limiter datastore */
  public get store(): LocalDatastore | RedisDatastore {
    return this._store;
  }
  /** Gets the event instance to which the limiter is associated */
  public get events(): EventEmitter {
    return this;
  }
  /** Gets the limiter's id */
  public get id(): string {
    return this._id;
  }
}
