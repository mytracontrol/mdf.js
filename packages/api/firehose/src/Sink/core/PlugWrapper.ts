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
import { Registry } from 'prom-client';
import { OpenJobObject, WrappableSinkPlug } from '../../types';

export class PlugWrapper extends EventEmitter implements Layer.App.Component {
  /** Indicate if the last operation was finished with error */
  private lastOperationError?: Crash | Multi;
  /** Date of the last operation performed */
  private lastOperationDate?: Date;
  /** Operation retry options */
  private readonly retryOptions: RetryOptions;
  /** Plug single operation original */
  private readonly singleOriginal: (job: OpenJobObject) => Promise<void>;
  /** Plug multi operation original */
  private readonly multiOriginal?: (jobs: OpenJobObject[]) => Promise<void>;
  /** Plug start operation original */
  private readonly startOriginal: () => Promise<void>;
  /** Plug stop operation original */
  private readonly stopOriginal: () => Promise<void>;
  /**
   * Create a new instance of PlugWrapper
   * @param plug - sink plug instance
   * @param retryOptions - options for job retry operations
   */
  constructor(
    private readonly plug: WrappableSinkPlug,
    retryOptions?: RetryOptions
  ) {
    super();
    this.retryOptions = merge({ logger: this.onOperationError }, retryOptions);
    if (!this.plug) {
      throw new Crash('PlugWrapper requires a plug instance');
    } else if (!this.plug.single) {
      throw new Crash(`Plug ${this.plug.name} does not implement the single method`);
    } else if (typeof this.plug.single !== 'function') {
      throw new Crash(`Plug ${this.plug.name} does not implement the single method properly`);
    } else {
      this.singleOriginal = this.plug.single;
      this.plug.single = this.single;
    }
    if (this.plug.multi) {
      if (typeof this.plug.multi !== 'function') {
        throw new Crash(`Plug ${this.plug.name} not implement the multi method properly`);
      } else {
        this.multiOriginal = this.plug.multi;
        this.plug.multi = this.multi;
      }
    }
    if (typeof this.plug.start !== 'function') {
      throw new Crash(`Plug ${this.plug.name} not implement the start method properly`);
    } else {
      this.startOriginal = this.plug.start;
      this.plug.start = this.start;
    }
    if (typeof this.plug.stop !== 'function') {
      throw new Crash(`Plug ${this.plug.name} not implement the stop method properly`);
    } else {
      this.stopOriginal = this.plug.stop;
      this.plug.stop = this.stop;
    }
  }
  /** Register an error in the plug operation */
  private readonly onOperationError = (rawError: Crash | Multi): void => {
    this.lastOperationError = Crash.from(rawError, this.plug.componentId);
    this.lastOperationDate = new Date();
    if (this.listenerCount('error') > 0) {
      this.emit('error', this.lastOperationError);
    }
  };
  /** Register an error in the plug operation */
  private readonly onOperationSuccess = (): void => {
    this.lastOperationError = undefined;
    this.lastOperationDate = new Date();
  };
  /**
   * Perform the retry functionality for a promise
   * @param task - promise to execute
   * @param funcArgs - promise arguments
   * @param options - control execution options
   * @returns promise result
   */
  private async wrappedOperation<T = any>(
    task: (...args: any[]) => Promise<T>,
    funcArgs: any[]
  ): Promise<T> {
    const result = await retryBind(task, this.plug, funcArgs, this.retryOptions);
    this.onOperationSuccess();
    return result;
  }
  /**
   * Perform the processing of a single Job
   * @param job - job to be processed
   */
  private readonly single = async (job: OpenJobObject): Promise<void> => {
    await this.wrappedOperation(this.singleOriginal, [job]);
  };
  /**
   * Perform the processing of several Jobs
   * @param jobs - jobs to be processed
   */
  private readonly multi = async (jobs: OpenJobObject[]): Promise<void> => {
    if (!this.multiOriginal) {
      throw new Crash(`Plug ${this.plug.name} does not implement the multi method`);
    }
    await this.wrappedOperation(this.multiOriginal, [jobs]);
  };
  /** Start the Plug and the underlayer resources, making it available */
  private readonly start = async (): Promise<void> => {
    await this.wrappedOperation(this.startOriginal, []);
  };
  /** Stop the Plug and the underlayer resources, making it unavailable */
  private readonly stop = async (): Promise<void> => {
    await this.wrappedOperation(this.stopOriginal, []);
  };
  /** Component name */
  public get name(): string {
    return this.plug.name;
  }
  /** Component identification */
  public get componentId(): string {
    return this.plug.componentId;
  }
  /** Metrics registry for this component */
  public get metrics(): Registry | undefined {
    return this.plug.metrics;
  }
  /**
   * Return the status of the stream in a standard format
   * @returns _check object_ as defined in the draft standard
   * https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check-05
   */
  public get checks(): Health.Checks {
    return {
      ...this.plug.checks,
      [`${this.plug.name}:lastOperation`]: [
        {
          status: this.lastOperationError ? 'fail' : 'pass',
          componentId: this.plug.componentId,
          componentType: 'plug',
          observedValue: this.lastOperationError ? 'error' : 'ok',
          observedUnit: 'result of last operation',
          time: this.lastOperationDate ? this.lastOperationDate.toISOString() : undefined,
          output: this.lastOperationError ? this.lastOperationError.trace() : undefined,
        },
      ],
    };
  }
}
