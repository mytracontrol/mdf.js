/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import EventEmitter from 'events';
import { cloneDeep, merge } from 'lodash';
import { DoneEventHandler, TaskHandler } from '../Tasks';
import { Queue } from './Queue';
import { ConsolidatedLimiterOptions, DEFAULT_OPTIONS, LimiterOptions, LimiterState } from './types';

export declare interface LimiterStateHandler {
  /**
   * Register an event listener over the `done` event, which is emitted when a task has ended, either
   * due to completion or failure.
   * @param event - `done` event
   * @param listener - Done event listener
   * @event
   */
  on(event: 'done' | string, listener: DoneEventHandler): this;
  /**
   * Register an event listener over the `done` event, which is emitted when a task has ended, either
   * due to completion or failure.
   * @param event - `done` event
   * @param listener - Done event listener
   * @event
   */
  addListener(event: 'done' | string, listener: DoneEventHandler): this;
  /**
   * Registers a event listener over the `done` event, at the beginning of the listeners array,
   * which is emitted when a task has ended, either due to completion or failure.
   * @param event - `done` event
   * @param listener - Done event listener
   * @event
   */
  prependListener(event: 'done' | string, listener: DoneEventHandler): this;
  /**
   * Registers a one-time event listener over the `done` event, which is emitted when a task has
   * ended, either due to completion or failure.
   * @param event - `done` event
   * @param listener - Done event listener
   * @event
   */
  once(event: 'done' | string, listener: DoneEventHandler): this;
  /**
   * Registers a one-time event listener over the `done` event, at the beginning of the listeners
   * array, which is emitted when a task has ended, either due to completion or failure.
   * @param event - `done` event
   * @param listener - Done event listener
   * @event
   */
  prependOnceListener(event: 'done' | string, listener: DoneEventHandler): this;
  /**
   * Removes the specified listener from the listener array for the `done` event.
   * @param event - `done` event
   * @param listener - The listener function to remove
   * @event
   */
  removeListener(event: 'done' | string, listener: DoneEventHandler): this;
  /**
   * Removes the specified listener from the listener array for the `done` event.
   * @param event - `done` event
   * @param listener - The listener function to remove
   * @event
   */
  off(event: 'done' | string, listener: DoneEventHandler): this;
  /**
   * Removes all listeners, or those of the specified event.
   * @param event - `done` event
   * @event
   */
  removeAllListeners(event?: 'done'): this;
  /**
   * Register an event listener over the `refill` event, which is emitted when queue bucket is refilled
   * @param event - `refill` event
   * @param listener - Refill event listener
   * @event
   */
  on(event: 'refill', listener: () => void): this;
  /**
   * Register an event listener over the `refill` event, which is emitted when queue bucket is refilled
   * @param event - `refill` event
   * @param listener - Refill event listener
   * @event
   */
  addListener(event: 'refill', listener: () => void): this;
  /**
   * Registers a event listener over the `refill` event, at the beginning of the listeners array,
   * which is emitted when queue bucket is refilled
   * @param event - `refill` event
   * @param listener - Refill event listener
   * @event
   */
  prependListener(event: 'refill', listener: () => void): this;
  /**
   * Registers a one-time event listener over the `refill` event, which is emitted when queue bucket
   * is refilled
   * @param event - `refill` event
   * @param listener - Refill event listener
   * @event
   */
  once(event: 'refill', listener: () => void): this;
  /**
   * Registers a one-time event listener over the `refill` event, at the beginning of the listeners
   * array, which is emitted when queue bucket is refilled
   * @param event - `refill` event
   * @param listener - Refill event listener
   * @event
   */
  prependOnceListener(event: 'refill', listener: () => void): this;
  /**
   * Removes the specified listener from the listener array for the `refill` event.
   * @param event - `refill` event
   * @param listener - The listener function to remove
   * @event
   */
  removeListener(event: 'refill', listener: () => void): this;
  /**
   * Removes the specified listener from the listener array for the `refill` event.
   * @param event - `refill` event
   * @param listener - The listener function to remove
   * @event
   */
  off(event: 'refill', listener: () => void): this;
  /**
   * Removes all listeners, or those of the specified event.
   * @param event - `refill` event
   * @event
   */
  removeAllListeners(event?: 'refill'): this;
  /**
   * Register an event listener over the `seed` event, which is emitted when queue is empty and a
   * new task is added
   * @param event - `seed` event
   * @param listener - The listener function to add
   * @event
   */
  on(event: 'seed', listener: () => void): this;
  /**
   * Register an event listener over the `seed` event, which is emitted when queue is empty and a
   * new task is added
   * @param event - `seed` event
   * @param listener - The listener function to add
   * @event
   */
  addListener(event: 'seed', listener: () => void): this;
  /**
   * Registers a event listener over the `seed` event, at the beginning of the listeners array, which
   * is emitted when queue is empty and a new task is added
   * @param event - `seed` event
   * @param listener - The listener function to add
   * @event
   */
  prependListener(event: 'seed', listener: () => void): this;
  /**
   * Registers a one-time event listener over the `seed` event, which is emitted when queue is empty
   * and a new task is added
   * @param event - `seed` event
   * @param listener - The listener function to add
   * @event
   */
  once(event: 'seed', listener: () => void): this;
  /**
   * Registers a one-time event listener over the `seed` event, at the beginning of the listeners
   * array, which is emitted when queue is empty and a new task is added
   * @param event - `seed` event
   * @param listener - The listener function to add
   * @event
   */
  prependOnceListener(event: 'seed', listener: () => void): this;
  /**
   * Removes the specified listener from the listener array for the `seed` event.
   * @param event - `seed` event
   * @param listener - The listener function to remove
   * @event
   */
  removeListener(event: 'seed', listener: () => void): this;
  /**
   * Removes the specified listener from the listener array for the `seed` event.
   * @param event - `seed` event
   * @param listener - The listener function to remove
   * @event
   */
  off(event: 'seed', listener: () => void): this;
  /**
   * Removes all listeners, or those of the specified event.
   * @param event - `seed` event
   * @event
   */
  removeAllListeners(event?: 'seed'): this;
}
/**
 * A limiter state handler is a class that manages the state of a limiter, including the queue of tasks,
 * the concurrency, and the limiter options.
 */
export abstract class LimiterStateHandler extends EventEmitter {
  /** The limiter queue of tasks */
  private readonly queue: Queue;
  /** The limiter options */
  private readonly _options: ConsolidatedLimiterOptions;
  /** The limiter state */
  private limiterState: LimiterState = LimiterState.STOPPED;
  /** The actual number of concurrent jobs */
  private concurrency: number = 0;
  /**
   * Create a new instance of Limiter
   * @param options - The limiter options
   */
  constructor(options?: LimiterOptions) {
    super();
    this._options = merge(cloneDeep(DEFAULT_OPTIONS), options);
    this.checkOptions(this._options);
    this.limiterState = this._options.autoStart ? LimiterState.IDLE : LimiterState.STOPPED;
    this.concurrency = 0;
    this.queue = new Queue(this._options);
    this.queue.on('seed', () => this.emit('seed'));
    this.queue.on('refill', () => this.emit('refill'));
  }
  /** Increase the concurrency */
  protected inc(): void {
    this.concurrency++;
  }
  /** Decrease the concurrency */
  protected dec(): void {
    this.concurrency--;
  }
  /** Enqueue a task */
  protected enqueue(task: TaskHandler): boolean {
    return this.queue.enqueue(task);
  }
  /** Dequeue a task */
  protected dequeue(): TaskHandler | undefined {
    return this.queue.dequeue();
  }
  /** Stop the limiter */
  protected stop(): void {
    this.limiterState = LimiterState.STOPPED;
  }
  /** Start the limiter */
  protected start(): void {
    this.limiterState = LimiterState.STARTING;
  }
  /** Check if the limiter is at capacity */
  protected get atCapacity(): boolean {
    return this.concurrency >= this.options.concurrency;
  }
  /** Check if the limiter can process more tasks */
  protected get canProcessMore(): boolean {
    return !this.atCapacity && this.queue.size > 0 && this.limiterState !== LimiterState.STOPPED;
  }
  /** Returns the configured delay between tasks */
  protected get delay(): number {
    return this._options.delay;
  }
  /**
   * Checks the options for the limiter and throws an error if they are invalid
   * @param options - The options to check
   */
  private checkOptions(options: LimiterOptions): void {
    if (
      typeof options.concurrency !== 'number' ||
      options.concurrency < 1 ||
      Number.isNaN(options.concurrency)
    ) {
      throw new Crash('The concurrency must be at least 1', { name: 'ValidationError' });
    }
    if (
      typeof options.delay !== 'number' ||
      options.delay < 0 ||
      Number.isNaN(options.delay) ||
      !Number.isFinite(options.delay)
    ) {
      throw new Crash('The delay should be a finite number greater than or equal to 0', {
        name: 'ValidationError',
      });
    }
    if (typeof options.autoStart !== 'boolean') {
      throw new Crash('The autoStart should be a boolean', { name: 'ValidationError' });
    }
  }
  /** Returns the number of jobs in the queue */
  public get size(): number {
    return this.queue.size;
  }
  /** Returns the number of pending jobs */
  public get pending(): number {
    return this.concurrency;
  }
  /** Clears the queue */
  public clear(): void {
    this.queue.clear();
  }
  /** Returns the limiter options */
  public get options(): Readonly<ConsolidatedLimiterOptions> {
    return this._options;
  }
}
