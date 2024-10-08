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
import { validate } from 'uuid';
import { Control, ProducerAdapter } from '../../../types';

export class AdapterWrapper extends EventEmitter implements Layer.App.Resource {
  /** Operation retry options */
  private readonly retryOptions: RetryOptions;
  /** Flag to indicate that an unhealthy status has been emitted recently */
  private lastStatusEmitted?: Health.Status;
  /** Indicate if the last operation was finished with error */
  private lastOperationError?: Crash | Multi;
  /** Date of the last operation performed */
  private lastOperationDate?: Date;
  /** Perform the publication of the message in the underlayer transport system */
  private readonly publishOriginal: (
    message: Control.CommandMessage
  ) => Promise<Control.ResponseMessage | Control.ResponseMessage[] | void>;
  /**
   * Create a new instance of AdapterWrapper
   * @param adapter - adapter instance
   * @param retryOptions - options for job retry operations
   */
  constructor(
    private readonly adapter: ProducerAdapter,
    retryOptions?: RetryOptions
  ) {
    super();
    this.retryOptions = merge({ logger: this.onOperationError }, retryOptions);
    if (!this.adapter) {
      throw new Crash('AdapterWrapper requires an adapter instance');
    }
    this.checkMandatoryMethods();
    this.publishOriginal = this.adapter.publish;
    this.adapter.publish = this.publish;
    this.on('newListener', (event, listener) => {
      if (validate(event)) {
        this.adapter.on(event, listener);
      }
    });
    this.on('removeListener', (event, listener) => {
      if (validate(event)) {
        this.adapter.off(event, listener);
      }
    });
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
    if (!this.adapter.publish || typeof this.adapter.publish !== 'function') {
      throw new Crash(`Adapter ${this.adapter.name} does not implement the publish method`);
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
  private readonly onOperationError = (rawError: Crash | Multi): void => {
    this.lastOperationError = Crash.from(rawError, this.adapter.componentId);
    this.lastOperationDate = new Date();
    this.emitStatus();
  };
  /** Register an error in the adapter operation */
  private readonly onOperationSuccess = (): void => {
    this.lastOperationError = undefined;
    this.lastOperationDate = new Date();
  };
  /** Perform the publication of the message in the underlayer transport system */
  public readonly publish = async (
    message: Control.Message
  ): Promise<Control.ResponseMessage | Control.ResponseMessage[] | void> => {
    return this.wrappedOperation(this.publishOriginal, [message], this.retryOptions);
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
          output: this.lastOperationError ? this.lastOperationError.trace() : undefined,
        },
      ],
    };
  }
}
