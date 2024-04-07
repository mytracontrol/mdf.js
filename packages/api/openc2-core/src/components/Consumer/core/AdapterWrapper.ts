/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health, Layer } from '@mdf.js/core';
import { Crash, Multi } from '@mdf.js/crash';
import { RetryOptions, retryBind } from '@mdf.js/utils';
import EventEmitter from 'events';
import { merge } from 'lodash';
import { ConsumerAdapter, OnCommandHandler } from '../../../types';

export class AdapterWrapper extends EventEmitter implements Layer.App.Resource {
  /** Operation retry options */
  private readonly retryOptions: RetryOptions;
  /** Flag to indicate that an unhealthy status has been emitted recently */
  private lastStatusEmitted?: Health.Status;
  /** Indicate if the last operation was finished with error */
  private lastOperationError?: Crash | Multi;
  /** Date of the last operation performed */
  private lastOperationDate?: Date;
  /** Subscribe the incoming message handler to the underlayer transport system */
  private readonly subscribeOriginal: (handler: OnCommandHandler) => Promise<void>;
  /** Unsubscribe the incoming message handler from the underlayer transport system */
  private readonly unsubscribeOriginal: (handler: OnCommandHandler) => Promise<void>;
  /**
   * Create a new instance of AdapterWrapper
   * @param adapter - adapter instance
   * @param retryOptions - options for job retry operations
   */
  constructor(
    private readonly adapter: ConsumerAdapter,
    retryOptions?: RetryOptions
  ) {
    super();
    this.retryOptions = merge({ logger: this.onOperationError }, retryOptions);
    if (!this.adapter) {
      throw new Crash('AdapterWrapper requires an adapter instance');
    }
    this.checkMandatoryMethods();
    this.subscribeOriginal = this.adapter.subscribe;
    this.unsubscribeOriginal = this.adapter.unsubscribe;
    this.adapter.subscribe = this.subscribe;
    this.adapter.unsubscribe = this.unsubscribe;
    this.adapter.on('error', this.onOperationError);
  }
  /** Component name */
  public get name(): string {
    return this.adapter.name;
  }
  /** Component identifier */
  public get componentId(): string {
    return this.adapter.componentId;
  }
  /** Connect the OpenC2 Adapter to the underlayer transport system */
  public start(): Promise<void> {
    return this.adapter.start();
  }
  /** Disconnect the OpenC2 Adapter to the underlayer transport system */
  public stop(): Promise<void> {
    return this.adapter.stop();
  }
  /** Close the OpenC2 Adapter to the underlayer transport system */
  public close(): Promise<void> {
    return this.adapter.close();
  }
  /**
   * Check if the adapter implements the mandatory methods
   * @throws Crash if the adapter does not implement the mandatory methods
   */
  private checkMandatoryMethods() {
    if (!this.adapter.subscribe || typeof this.adapter.subscribe !== 'function') {
      throw new Crash(`Adapter ${this.adapter.name} does not implement the subscribe method`);
    } else if (!this.adapter.unsubscribe || typeof this.adapter.unsubscribe !== 'function') {
      throw new Crash(`Adapter ${this.adapter.name} does not implement the unsubscribe method`);
    }
  }
  /**
   * Perform the retry functionality for a promise
   * @param task - promise to execute
   * @param funcArgs - promise arguments
   * @param options - control execution options
   * @returns
   */
  private async wrappedOperation<T = any>(
    task: (...args: any[]) => Promise<T>,
    funcArgs?: any[],
    options?: RetryOptions
  ): Promise<T> {
    try {
      const result = await retryBind(task, this.adapter, funcArgs, options);
      this.onOperationSuccess();
      return result;
    } catch (rawError) {
      const error = new Crash(
        `Error performing [${task.name}] operation on ${this.adapter.name} plug`,
        this.adapter.componentId,
        { cause: Crash.from(rawError, this.adapter.componentId) }
      );
      this.onOperationError(error);
      throw rawError;
    }
  }
  /** Overall component status */
  public get status(): Health.Status {
    return Health.overallStatus(this.checks);
  }
  /** Emit the status if it's different from the last emitted status */
  private emitStatus(): void {
    if (this.lastStatusEmitted !== this.status) {
      this.lastStatusEmitted = this.status;
      this.emit('status', this.status);
    }
  }
  /** Register an error in the adapter operation */
  private readonly onOperationError = (rawError: Crash | Multi | Error): void => {
    this.lastOperationError = Crash.from(rawError, this.adapter.componentId);
    this.lastOperationDate = new Date();
    this.emitStatus();
  };
  /** Register an error in the adapter operation */
  private readonly onOperationSuccess = (): void => {
    this.lastOperationError = undefined;
    this.lastOperationDate = new Date();
  };
  /** Subscribe the incoming message handler to the underlayer transport system */
  public subscribe = async (handler: OnCommandHandler): Promise<void> => {
    return this.wrappedOperation(this.subscribeOriginal, [handler], this.retryOptions);
  };
  /** Unsubscribe the incoming message handler from the underlayer transport system*/
  public unsubscribe = async (handler: OnCommandHandler): Promise<void> => {
    return this.wrappedOperation(this.unsubscribeOriginal, [handler], this.retryOptions);
  };
  /**
   * Return the status of the adapter in a standard format
   * @returns _check object_ as defined in the draft standard
   * https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check-05
   */
  public get checks(): Health.Checks {
    return {
      ...this.adapter.checks,
      [`${this.adapter.name}:lastOperation`]: [
        {
          status: this.lastOperationError ? 'fail' : 'pass',
          componentId: this.adapter.componentId,
          componentType: 'adapter',
          observedValue: this.lastOperationError ? 'error' : 'ok',
          observedUnit: 'result of last operation',
          time: this.lastOperationDate ? this.lastOperationDate.toISOString() : undefined,
          output: this.lastOperationError ? this.lastOperationError?.trace() : undefined,
        },
      ],
    };
  }
}
