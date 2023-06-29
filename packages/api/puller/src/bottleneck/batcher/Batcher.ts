/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { BATCHER_DEFAULTS, BatcherOptions, BatcherOptionsComplete } from '.';
import { Events } from '../events';
import { load } from '../parser';

/**
 * Manages batching of data and triggers batch events when conditions are met.
 * @typeparam Data - The type of data to be batched.
 */
export class Batcher<Data> {
  /** The array that holds the batched data */
  private _arr: Data[] = [];
  /** The event manager for handling batch events */
  private _events: Events;
  /** The timeout object for the batch flush */
  private _timeout: NodeJS.Timeout | undefined;
  /** The promise that resolves when the batch is flushed */
  private _promise: Promise<void> | undefined;
  /** The function to resolve the batch promise */
  private _resolve: (() => void) | undefined;

  /** Batcher options */
  private _batcherOptions: BatcherOptionsComplete;
  /** The maximum size of the batch before triggering a flush, loaded from _batcherOptions */
  private _maxSize: number | null;
  /** The maximum time duration before triggering a flush (in milliseconds), loaded from
   * _batcherOptions */
  private _maxTime: number | null;

  /**
   * The timestamp of the last flush.
   * @remarks
   * TODO: This property is currently not used and its purpose is unknown.
   */
  private _lastFlush: number;

  /** On event listener to be handled by events object */
  public on: any;
  /** Once event listener to be handled by events object */
  public once: any;
  /** Remove event listeners functionality to be handled by events object */
  public removeAllListeners: any;

  /**
   * Creates an instance of Batcher.
   * @param options - The options for configuring the Batcher.
   */
  constructor(options: BatcherOptions = {}) {
    /** Initialize batcher options */
    this._batcherOptions = load(options, BATCHER_DEFAULTS, {}) as BatcherOptionsComplete;
    this._maxSize = this._batcherOptions.maxSize;
    this._maxTime = this._batcherOptions.maxTime;

    /** Initialize promise */
    this._resetPromise();

    this._lastFlush = Date.now();

    /** Initialize event listeners */
    this.on = null;
    this.once = null;
    this.removeAllListeners = null;
    this._events = new Events(this);
  }

  /** Resets the batch promise and resolve function */
  private _resetPromise(): void {
    this._promise = new Promise<void>((res, rej) => {
      return (this._resolve = res);
    });
  }

  /** Flushes the batch, triggers batch events, and resets the batch promise */
  private _flush = (): void => {
    clearTimeout(this._timeout);
    this._lastFlush = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this._resolve!();

    this._events.trigger('batch', this._arr);
    this._arr = [];
    this._resetPromise();
  };

  /**
   * Adds data to the batch.
   * @param data - The data to be added to the batch.
   * @returns A promise that resolves when the batch is flushed.
   */
  public add(data: Data): Promise<void> {
    this._arr.push(data);
    const ret = this._promise;

    if (this._arr.length === this._maxSize) {
      this._flush();
    } else if (this._maxTime != null && this._arr.length === 1) {
      this._timeout = setTimeout(this._flush, this._maxTime);
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return ret!;
  }
}
