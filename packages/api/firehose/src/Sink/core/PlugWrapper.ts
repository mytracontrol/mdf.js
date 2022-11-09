/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health } from '@mdf.js/core';
import { Crash, Multi } from '@mdf.js/crash';
import { retryBind, RetryOptions } from '@mdf.js/utils';
import EventEmitter from 'events';
import { merge } from 'lodash';
import { Plugs, WrappableSinkPlug } from '../../types';

export class PlugWrapper<Type extends string = string, Data = any> extends EventEmitter {
  /** Indicate if the last operation was finished with error */
  private lastOperationError?: Crash | Multi;
  /** Date of the last operation performed */
  private lastOperationDate?: Date;
  /** Operation retry options */
  #retryOptions: RetryOptions;
  /** Plug single operation original */
  private readonly singleOriginal: (job: Plugs.Sink.JobObject<Type, Data>) => Promise<void>;
  /** Plug multi operation original */
  private readonly multiOriginal?: (jobs: Plugs.Sink.JobObject<Type, Data>[]) => Promise<void>;
  /**
   * Create a new instance of PlugWrapper
   * @param plug - sink plug instance
   * @param retryOptions - options for job retry operations
   */
  constructor(private readonly plug: WrappableSinkPlug<Type, Data>, retryOptions?: RetryOptions) {
    super();
    this.#retryOptions = merge({ logger: this.onOperationError }, retryOptions);
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
  }
  /** Register an error in the plug operation */
  private readonly onOperationError = (rawError: Crash | Multi): void => {
    this.lastOperationError = Crash.from(rawError, this.plug.componentId);
    this.lastOperationDate = new Date();
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
   * @returns
   */
  private async wrappedOperation<T = any>(
    task: (...args: any[]) => Promise<T>,
    funcArgs: any[]
  ): Promise<T> {
    const result = await retryBind(task, this.plug, funcArgs, this.#retryOptions);
    this.onOperationSuccess();
    return result;
  }
  /**
   * Perform the processing of a single Job
   * @param job - job to be processed
   */
  private readonly single = async (job: Plugs.Sink.JobObject<Type, Data>): Promise<void> => {
    await this.wrappedOperation(this.singleOriginal, [job]);
  };
  /**
   * Perform the processing of several Jobs
   * @param jobs - jobs to be processed
   */
  private readonly multi = async (jobs: Plugs.Sink.JobObject<Type, Data>[]): Promise<void> => {
    if (!this.multiOriginal) {
      throw new Crash(`Plug ${this.plug.name} does not implement the multi method`);
    }
    await this.wrappedOperation(this.multiOriginal, [jobs]);
  };
  /**
   * Return the status of the stream in a standard format
   * @returns _check object_ as defined in the draft standard
   * https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check-05
   */
  public get checks(): Health.API.Checks {
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
