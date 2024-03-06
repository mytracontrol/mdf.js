/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { EventEmitter } from 'eventemitter3';
import { EVENT_NAME, EventName, Options, Queue, QueueAddOptions, RunFunction, Task } from './types';
import { PriorityQueue, pTimeout } from './utils';

/** Promise queue with concurrency control */
export class PQueue<
  QueueType extends Queue<RunFunction, EnqueueOptionsType> = PriorityQueue,
  EnqueueOptionsType extends QueueAddOptions = QueueAddOptions,
> extends EventEmitter<EventName> {
  private readonly _carryoverConcurrencyCount: boolean;
  private readonly _isIntervalIgnored: boolean;
  private _intervalCount = 0;
  private readonly _intervalCap: number;
  private readonly _interval: number;
  private _intervalEnd = 0;
  private _intervalId?: NodeJS.Timeout;
  private _timeoutId?: NodeJS.Timeout;
  private _queue: QueueType;
  private readonly _queueClass: new () => QueueType;
  private _pending = 0;
  // The `!` is needed because of https://github.com/microsoft/TypeScript/issues/32194
  private _concurrency!: number;
  private _isPaused: boolean;
  private readonly _throwOnTimeout: boolean;
  /**
   * Per-operation timeout in milliseconds. Operations fulfill once `timeout` elapses if they
   * haven't already.
   * Applies to each future operation.
   */
  timeout?: number;
  // TODO: The `throwOnTimeout` option should affect the return types of `add()` and `addAll()`
  /**
   * Create a new limited promise queue.
   * @param options - Options for the queue and the tasks
   */
  constructor(options?: Options<QueueType, EnqueueOptionsType>) {
    super();
    options = {
      carryoverConcurrencyCount: false,
      intervalCap: Number.POSITIVE_INFINITY,
      interval: 0,
      concurrency: Number.POSITIVE_INFINITY,
      autoStart: true,
      queueClass: PriorityQueue,
      ...options,
    } as Options<QueueType, EnqueueOptionsType>;
    if (!(typeof options.intervalCap === 'number' && options.intervalCap >= 1)) {
      throw new TypeError(
        `Expected \`intervalCap\` to be a number from 1 and up, got \`${options.intervalCap?.toString() ?? ''}\` (${typeof options.intervalCap})`
      );
    }
    if (
      options.interval === undefined ||
      !(Number.isFinite(options.interval) && options.interval >= 0)
    ) {
      throw new TypeError(
        `Expected \`interval\` to be a finite number >= 0, got \`${options.interval?.toString() ?? ''}\` (${typeof options.interval})`
      );
    }
    this._carryoverConcurrencyCount = options.carryoverConcurrencyCount!;
    this._isIntervalIgnored =
      options.intervalCap === Number.POSITIVE_INFINITY || options.interval === 0;
    this._intervalCap = options.intervalCap;
    this._interval = options.interval;
    this._queue = new options.queueClass!();
    this._queueClass = options.queueClass!;
    this.concurrency = options.concurrency!;
    this.timeout = options.timeout;
    this._throwOnTimeout = options.throwOnTimeout === true;
    this._isPaused = options.autoStart === false;
  }
  private get doesIntervalAllowAnother(): boolean {
    return this._isIntervalIgnored || this._intervalCount < this._intervalCap;
  }
  private get doesConcurrentAllowAnother(): boolean {
    return this._pending < this._concurrency;
  }
  private next(): void {
    this._pending--;
    this.tryToStartAnother();
    this.emit(EVENT_NAME.NEXT);
  }
  private onResumeInterval(): void {
    this.onInterval();
    this.initializeIntervalIfNeeded();
    this._timeoutId = undefined;
  }
  private get isIntervalPaused(): boolean {
    const now = Date.now();
    if (this._intervalId === undefined) {
      const delay = this._intervalEnd - now;
      if (delay < 0) {
        // Act as the interval was done
        // We don't need to resume it here because it will be resumed on line 160
        this._intervalCount = this._carryoverConcurrencyCount ? this._pending : 0;
      } else {
        // Act as the interval is pending
        if (this._timeoutId === undefined) {
          this._timeoutId = setTimeout(() => {
            this.onResumeInterval();
          }, delay);
        }

        return true;
      }
    }

    return false;
  }
  private tryToStartAnother(): boolean {
    if (this._queue.size === 0) {
      // We can clear the interval ("pause")
      // Because we can redo it later ("resume")
      if (this._intervalId) {
        clearInterval(this._intervalId);
      }
      this._intervalId = undefined;
      this.emit(EVENT_NAME.EMPTY);
      if (this._pending === 0) {
        this.emit(EVENT_NAME.IDLE);
      }
      return false;
    }
    if (!this._isPaused) {
      const canInitializeInterval = !this.isIntervalPaused;
      if (this.doesIntervalAllowAnother && this.doesConcurrentAllowAnother) {
        const job = this._queue.dequeue();
        if (!job) {
          return false;
        }
        this.emit(EVENT_NAME.ACTIVE);
        job();
        if (canInitializeInterval) {
          this.initializeIntervalIfNeeded();
        }
        return true;
      }
    }
    return false;
  }
  private initializeIntervalIfNeeded(): void {
    if (this._isIntervalIgnored || this._intervalId !== undefined) {
      return;
    }
    this._intervalId = setInterval(() => {
      this.onInterval();
    }, this._interval);
    this._intervalEnd = Date.now() + this._interval;
  }
  private onInterval(): void {
    if (this._intervalCount === 0 && this._pending === 0 && this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = undefined;
    }
    this._intervalCount = this._carryoverConcurrencyCount ? this._pending : 0;
    this.processQueue();
  }
  /**	Executes all queued functions until it reaches the limit 	*/
  private processQueue(): void {
    while (this.tryToStartAnother()) {}
  }
  /** The maximum number of concurrent promises that can be executed */
  public get concurrency(): number {
    return this._concurrency;
  }
  /**
   * The maximum number of concurrent tasks that can be processed by the queue.
   * Must be a number greater than or equal to 1.
   */
  public set concurrency(value: number) {
    if (!(typeof value === 'number' && value >= 1)) {
      throw new Crash(
        `Expected \`concurrency\` to be a number from 1 and up, got \`${value}\` (${typeof value})`
      );
    }
    this._concurrency = value;
    this.processQueue();
  }
  /**
   * Throws an error when the provided AbortSignal is aborted.
   * @param signal - The AbortSignal to listen for abort events.
   * @returns A Promise that never resolves and always throws an error with the abort reason.
   */
  private async throwOnAbort(signal: AbortSignal): Promise<never> {
    return new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    });
  }
  /**
   * Adds a sync or async task to the queue. Always returns a promise
   * @param function_ - Task to run. You can return a value or a promise that resolves to a value.
   * @param options - Options for the task
   */
  async add<TaskResultType>(
    function_: Task<TaskResultType>,
    options: { throwOnTimeout: true } & Exclude<EnqueueOptionsType, 'throwOnTimeout'>
  ): Promise<TaskResultType>;
  /**
   * Adds a sync or async task to the queue. Always returns a promise
   * @param function_ - Task to run. You can return a value or a promise that resolves to a value.
   * @param options - Options for the task
   */
  async add<TaskResultType>(
    function_: Task<TaskResultType>,
    options?: Partial<EnqueueOptionsType>
  ): Promise<TaskResultType | void>;
  async add<TaskResultType>(
    function_: Task<TaskResultType>,
    options: Partial<EnqueueOptionsType> = {}
  ): Promise<TaskResultType | void> {
    options = {
      timeout: this.timeout,
      throwOnTimeout: this._throwOnTimeout,
      ...options,
    };
    return new Promise((resolve, reject) => {
      this._queue.enqueue(async () => {
        this._pending++;
        this._intervalCount++;
        try {
          options.signal?.throwIfAborted();
          let operation = function_({ signal: options.signal });
          if (options.timeout) {
            operation = pTimeout(Promise.resolve(operation), { milliseconds: options.timeout });
          }
          if (options.signal) {
            operation = Promise.race([operation, this.throwOnAbort(options.signal)]);
          }
          const result = await operation;
          resolve(result);
          this.emit(EVENT_NAME.COMPLETED, result);
        } catch (rawError: unknown) {
          const error = Crash.from(rawError);
          if (error.name === 'TimeoutError' && !options.throwOnTimeout) {
            resolve();
            return;
          }
          reject(error);
          this.emit(EVENT_NAME.ERROR, error);
        } finally {
          this.next();
        }
      }, options);
      this.emit(EVENT_NAME.ADD);
      this.tryToStartAnother();
    });
  }
  /**
   * Same as `.add()`, but accepts an array of sync or async functions.
   * @param functions - Functions to run. Each function is run with the given arguments.
   * @param options - Options for the tasks
   * @returns A promise that resolves when all functions are resolved.
   */
  async addAll<TaskResultsType>(
    functions: ReadonlyArray<Task<TaskResultsType>>,
    options?: { throwOnTimeout: true } & Partial<Exclude<EnqueueOptionsType, 'throwOnTimeout'>>
  ): Promise<TaskResultsType[]>;
  /**
   * Same as `.add()`, but accepts an array of sync or async functions.
   * @param functions - Functions to run. Each function is run with the given arguments.
   * @param options - Options for the tasks
   * @returns A promise that resolves when all functions are resolved.
   */
  async addAll<TaskResultsType>(
    functions: ReadonlyArray<Task<TaskResultsType>>,
    options?: Partial<EnqueueOptionsType>
  ): Promise<Array<TaskResultsType | void>>;
  async addAll<TaskResultsType>(
    functions: ReadonlyArray<Task<TaskResultsType>>,
    options?: Partial<EnqueueOptionsType>
  ): Promise<Array<TaskResultsType | void>> {
    return Promise.all(functions.map(async function_ => this.add(function_, options)));
  }
  /**
   * Start (or resume) executing enqueued tasks within concurrency limit. No need to call this if
   * queue is not paused (via `options.autoStart = false` or by `.pause()` method.)
   */
  start(): this {
    if (!this._isPaused) {
      return this;
    }
    this._isPaused = false;
    this.processQueue();
    return this;
  }
  /** Put queue execution on hold	*/
  pause(): void {
    this._isPaused = true;
  }
  /** Clear the queue */
  clear(): void {
    this._queue = new this._queueClass();
  }
  /**
   * Can be called multiple times. Useful if you for example add additional items at a later time.
   * @returns A promise that settles when the queue becomes empty.
   */
  async onEmpty(): Promise<void> {
    // Instantly resolve if the queue is empty
    if (this._queue.size === 0) {
      return;
    }
    await this.onEvent('empty');
  }
  /**
   * @param limit - The number of items to wait for before the promise resolves.
   * @returns A promise that settles when the queue size is less than the given limit:
   * `queue.size < limit`.
   * If you want to avoid having the queue grow beyond a certain size you can
   * `await queue.onSizeLessThan()` before adding a new item.
   * Note that this only limits the number of items waiting to start. There could still be up to
   * `concurrency` jobs already running that this call does not include in its calculation.
   */
  async onSizeLessThan(limit: number): Promise<void> {
    // Instantly resolve if the queue is empty.
    if (this._queue.size < limit) {
      return;
    }
    await this.onEvent(EVENT_NAME.NEXT, () => this._queue.size < limit);
  }
  /**
   * The difference with `.onEmpty` is that `.onIdle` guarantees that all work from the queue has
   * finished. `.onEmpty` merely signals that the queue is empty, but it could mean that some
   * promises haven't completed yet.
   * @returns A promise that settles when the queue becomes empty, and all promises have completed;
   * `queue.size === 0 && queue.pending === 0`.
   */
  async onIdle(): Promise<void> {
    // Instantly resolve if none pending and if nothing else is queued
    if (this._pending === 0 && this._queue.size === 0) {
      return;
    }
    await this.onEvent(EVENT_NAME.IDLE);
  }
  /**
   * @param event - Event name
   * @param filter - Filter function
   * @returns A promise that settles when the event is emitted.
   * The promise resolves to the arguments that are passed to the event listener.
   */
  private async onEvent(event: EventName, filter?: () => boolean): Promise<void> {
    return new Promise(resolve => {
      const listener = () => {
        if (filter && !filter()) {
          return;
        }
        this.off(event, listener);
        resolve();
      };
      this.on(event, listener);
    });
  }
  /** Size of the queue, the number of queued items waiting to run */
  get size(): number {
    return this._queue.size;
  }
  /**
   * Size of the queue, filtered by the given options.
   * For example, this can be used to find the number of items remaining in the queue with a
   * specific priority level.
   * @param options - The options to filter the queue by.
   */
  sizeBy(options: Readonly<Partial<EnqueueOptionsType>>): number {
    return this._queue.filter(options).length;
  }
  /** Number of running items (no longer in the queue) */
  get pending(): number {
    return this._pending;
  }
  /** Whether the queue is currently paused	*/
  get isPaused(): boolean {
    return this._isPaused;
  }
}
