/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health, type Layer } from '@mdf.js/core';
import { Crash, type Multi } from '@mdf.js/crash';
import EventEmitter from 'events';
import type { Pusher } from './types';

export class PusherWrapper extends EventEmitter implements Layer.App.Resource, Pusher {
  /** Indicate if the last operation was finished with error */
  private lastOperationError?: Crash | Multi;
  /** Date of the last operation performed */
  private lastOperationDate?: Date;
  /** Pusher push operation original */
  private readonly pushOriginal: (filePath: string, key: string) => Promise<void>;
  /** Pusher start operation original */
  private readonly startOriginal: () => Promise<void>;
  /** Pusher stop operation original */
  private readonly stopOriginal: () => Promise<void>;
  /** Pusher close operation original */
  private readonly closeOriginal: () => Promise<void>;
  /**
   * Create a new instance of PusherWrapper
   * @param pusher - pusher instance
   */
  constructor(private readonly pusher: Pusher) {
    super();
    if (!this.pusher) {
      throw new Crash('PusherWrapper requires a pusher instance');
    } else if (!this.pusher.push) {
      throw new Crash(`Pusher ${this.pusher.name} does not implement the push method`);
    } else if (typeof this.pusher.push !== 'function') {
      throw new Crash(`Pusher ${this.pusher.name} does not implement the push method properly`);
    } else {
      this.pushOriginal = this.pusher.push;
      this.pusher.push = this.push;
    }
    if (typeof this.pusher.start !== 'function') {
      throw new Crash(`Pusher ${this.pusher.name} not implement the start method properly`);
    } else {
      this.startOriginal = this.pusher.start;
      this.pusher.start = this.start;
    }
    if (typeof this.pusher.stop !== 'function') {
      throw new Crash(`Pusher ${this.pusher.name} not implement the stop method properly`);
    } else {
      this.stopOriginal = this.pusher.stop;
      this.pusher.stop = this.stop;
    }
    if (typeof this.pusher.close !== 'function') {
      throw new Crash(`Pusher ${this.pusher.name} not implement the close method properly`);
    } else {
      this.closeOriginal = this.pusher.close;
      this.pusher.close = this.close;
    }
  }
  /** Register an error in the pusher operation */
  private readonly onOperationError = (rawError: unknown): void => {
    this.lastOperationError = Crash.from(rawError, this.pusher.componentId);
    this.lastOperationDate = new Date();
    if (this.listenerCount('error') > 0) {
      this.emit('error', this.lastOperationError);
    }
  };
  /** Register an error in the pusher operation */
  private readonly onOperationSuccess = (): void => {
    this.lastOperationError = undefined;
    this.lastOperationDate = new Date();
  };
  /**
   * Perform the retry functionality for a promise
   * @param task - promise to execute
   * @param funcArgs - promise arguments
   * @param options - control execution options
   * @returns the promise result
   */
  private async wrappedOperation<T = any>(
    task: (...args: any[]) => Promise<T>,
    funcArgs: any[]
  ): Promise<T> {
    try {
      const result = await task(...funcArgs);
      this.onOperationSuccess();
      return result;
    } catch (error) {
      this.onOperationError(error);
      throw error;
    }
  }
  /**
   * Perform the processing of the push operation
   * @param filePath - The file path to push
   * @param key - The key to use
   * @returns the promise result
   */
  public readonly push = async (filePath: string, key: string): Promise<void> => {
    await this.wrappedOperation(this.pushOriginal, [filePath, key]);
  };
  /** Start the Pusher and the underlayer resources, making it available */
  public readonly start = async (): Promise<void> => {
    await this.wrappedOperation(this.startOriginal, []);
  };
  /** Stop the Pusher and the underlayer resources */
  public readonly stop = async (): Promise<void> => {
    await this.wrappedOperation(this.stopOriginal, []);
  };
  /** Close the Pusher and the underlayer resources, making it unavailable */
  public readonly close = async (): Promise<void> => {
    await this.wrappedOperation(this.closeOriginal, []);
  };
  /** Component name */
  public get name(): string {
    return this.pusher.name;
  }
  /** Component identification */
  public get componentId(): string {
    return this.pusher.componentId;
  }
  /**
   * Return the status of the stream in a standard format
   * @returns _check object_ as defined in the draft standard
   * https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check-05
   */
  public get checks(): Health.Checks {
    return {
      ...this.pusher.checks,
      [`${this.pusher.name}:lastOperation`]: [
        {
          status: this.lastOperationError ? 'fail' : 'pass',
          componentId: this.pusher.componentId,
          componentType: 'plug',
          observedValue: this.lastOperationError ? 'error' : 'ok',
          observedUnit: 'result of last operation',
          time: this.lastOperationDate ? this.lastOperationDate.toISOString() : undefined,
          output: this.lastOperationError ? this.lastOperationError.trace() : undefined,
        },
      ],
    };
  }
  /** Overall component status */
  public get status(): Health.Status {
    return Health.overallStatus(this.checks);
  }
}
