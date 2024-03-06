/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Crash } from '@mdf.js/crash';
import EventEmitter from 'events';
import { BatcherOptions } from './types';

/**
 * Manages batching of data and triggers batch events when conditions are met.
 * @typeparam Data - The type of data to be batched.
 */
export class Batcher<Data> extends EventEmitter {
  /** The array that holds the batched data */
  private buffer: Data[] = [];
  /** The timeout object for the batch flush */
  private timeout: NodeJS.Timeout | undefined;
  /** The promise that resolves when the batch is flushed */
  private promise: Promise<void>;
  /** The function to resolve the batch promise */
  private resolve: (() => void) | undefined;
  /**
   * Creates an instance of Batcher.
   * @param options - The options for configuring the Batcher.
   */
  constructor(private readonly options: BatcherOptions = {}) {
    super();
    if (
      (typeof this.options.maxTime !== 'undefined' && typeof this.options.maxTime !== 'number') ||
      (typeof this.options.maxTime === 'number' && this.options.maxTime < 1)
    ) {
      throw new Crash(`Batcher options maxTime should be a positive number`);
    } else if (
      (typeof this.options.maxSize !== 'undefined' && typeof this.options.maxSize !== 'number') ||
      (typeof this.options.maxSize === 'number' && this.options.maxSize < 1)
    ) {
      throw new Crash(`Batcher options maxSize should be a positive number`);
    } else if (!this.options.maxTime && !this.options.maxSize) {
      throw new Crash(`At least one of the batcher options should be provided`);
    }
    this.promise = this.resetPromise();
  }
  /** Resets the batch promise and resolve function */
  private resetPromise(): Promise<void> {
    return new Promise<void>(resolve => {
      return (this.resolve = resolve);
    });
  }
  /** Flushes the batch, triggers batch events, and resets the batch promise */
  private flush = (): void => {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
    if (!this.resolve) {
      throw new Crash(`Batcher promise resolve function is undefined`);
    }
    this.emit('batch', this.buffer);
    this.buffer = [];
    this.resolve();
    this.promise = this.resetPromise();
  };
  /**
   * Adds data to the batch.
   * @param data - The data to be added to the batch.
   * @returns A promise that resolves when the batch is flushed.
   */
  public add(data: Data): Promise<void> {
    this.buffer.push(data);
    if (this.options.maxSize && this.buffer.length === this.options.maxSize) {
      process.nextTick(this.flush);
    } else if (this.options.maxTime && !this.timeout) {
      this.timeout = setTimeout(this.flush, this.options.maxTime);
    }
    return this.promise;
  }
}
