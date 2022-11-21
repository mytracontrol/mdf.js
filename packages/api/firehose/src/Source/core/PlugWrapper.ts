/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health } from '@mdf.js/core';
import { Crash, Multi } from '@mdf.js/crash';
import { overallStatus, retryBind, RetryOptions } from '@mdf.js/utils';
import EventEmitter from 'events';
import { merge } from 'lodash';
import { Plugs, PostConsumeOptions, WrappableSourcePlug } from '../../types';
import {
  CONFIG_SOURCE_PLUG_CHECK_UNCLEANED_INTERVAL,
  CONFIG_SOURCE_PLUG_MAX_UNKNOWN_JOBS,
} from './const';

export class PlugWrapper<
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, unknown> = Record<string, unknown>
> extends EventEmitter {
  /** Jobs uncleaned after job finish due to problems in the post consume command */
  private readonly uncleanedEntries: string[] = [];
  /** Jobs uncleaned after job finish due to the plugs has declare that not exist */
  private readonly unknownEntries: string[] = [];
  /** Operation retry options */
  private readonly retryOptions: RetryOptions;
  /** Post consume operation options */
  private readonly postConsumeOptions: Required<PostConsumeOptions>;
  /** Uncleaned jobs check internal interval */
  private interval?: NodeJS.Timeout;
  /** Flag to indicate that an unhealthy status has been emitted recently */
  private lastStatusEmitted?: Health.API.Status;
  /** Indicate if the last operation was finished with error */
  private lastOperationError?: Crash | Multi;
  /** Date of the last operation performed */
  private lastOperationDate?: Date;
  /** Plug post consume operation original */
  private readonly postConsumeOriginal: (jobId: string) => Promise<string | undefined>;
  /** Plug ingest data operation */
  private readonly ingestDataOriginal?: (
    size: number
  ) => Promise<
    | Plugs.Source.JobObject<Type, Data, CustomHeaders>
    | Plugs.Source.JobObject<Type, Data, CustomHeaders>[]
  >;
  /**
   * Create a new instance of PlugWrapper
   * @param plug - source plug instance
   * @param retryOptions - options for job retry operations
   * @param postConsumeOptions - options for post consume operations
   */
  constructor(
    private readonly plug: WrappableSourcePlug<Type, Data, CustomHeaders>,
    retryOptions?: RetryOptions,
    postConsumeOptions?: PostConsumeOptions
  ) {
    super();
    this.retryOptions = merge({ logger: this.onOperationError }, retryOptions);
    this.postConsumeOptions = merge(
      {
        maxUnknownJobs: CONFIG_SOURCE_PLUG_MAX_UNKNOWN_JOBS,
        checkUncleanedInterval: CONFIG_SOURCE_PLUG_CHECK_UNCLEANED_INTERVAL,
      },
      postConsumeOptions
    );
    if (!this.plug) {
      throw new Crash('PlugWrapper requires a plug instance');
    } else if (!this.plug.postConsume) {
      throw new Crash(`Plug ${this.plug.name} does not implement the postConsume method`);
    } else if (typeof this.plug.postConsume !== 'function') {
      throw new Crash(`Plug ${this.plug.name} does not implement the postConsume method properly`);
    } else {
      this.postConsumeOriginal = this.plug.postConsume;
      this.plug.postConsume = this.postConsume;
    }
    if (this.plug.ingestData) {
      if (typeof this.plug.ingestData !== 'function') {
        throw new Crash(`Plug ${this.plug.name} does not implement the ingestData method properly`);
      } else {
        this.ingestDataOriginal = this.plug.ingestData;
        this.plug.ingestData = this.ingestData;
      }
    }
  }
  /**
   * Establish the uncleaned entries in list check internal
   * @param interval - Define the interval to check if there are pending jobs
   * @returns
   */
  private startUncleanedCheckInterval(): void {
    if (this.interval) {
      return;
    }
    this.interval = setInterval(
      this.checkPendingJobs,
      this.postConsumeOptions.checkUncleanedInterval
    );
    this.emitStatus();
  }
  /** Stop the the uncleaned entries in list check internal */
  private stopUncleanedCheckInterval(): void {
    if (this.interval && this.uncleanedEntries.length === 0) {
      clearInterval(this.interval);
      this.interval = undefined;
      this.emitStatus();
    }
  }
  /** Emit the status if it's different from the last emitted status */
  private emitStatus(): void {
    if (this.lastStatusEmitted !== this.overallStatus) {
      this.lastStatusEmitted = this.overallStatus;
      this.emit('status', this.overallStatus);
    }
  }
  /** Try to clean all the buffered entries pending for cleaning and return the uncleaned entries */
  private readonly checkPendingJobs = (): void => {
    const tasks = this.uncleanedEntries.map(this.plug.postConsume);
    Promise.allSettled(tasks).then(result => {
      for (const entry of result) {
        if (entry.status === 'fulfilled' && typeof entry.value === 'string') {
          this.uncleanedEntries.splice(this.uncleanedEntries.indexOf(entry.value));
        }
      }
    });
    this.stopUncleanedCheckInterval();
  };
  /** Overall component status */
  private get overallStatus(): Health.API.Status {
    return overallStatus(this.checks);
  }
  /**
   * Generate the health checks from passed job register
   * @param register - JobRegister instance
   * @param observedUnit - observed unit identification
   * @returns
   */
  private getRegisterHealthCheck(register: string[], observedUnit: string): Health.API.Check[] {
    return [
      {
        status: register.length === 0 ? 'pass' : 'fail',
        componentId: this.plug.componentId,
        componentType: 'source',
        observedValue: register.length,
        observedUnit,
        time: new Date().toISOString(),
        output: register.length !== 0 ? register : undefined,
      },
    ];
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
  private async wrappedOperation<T>(
    task: (...args: any[]) => Promise<T>,
    funcArgs?: any[],
    options?: RetryOptions
  ): Promise<T> {
    try {
      const result = await retryBind(task, this.plug, funcArgs, options);
      this.onOperationSuccess();
      return result;
    } catch (rawError) {
      const error = new Crash(
        `Error performing [${task.name}] operation on ${this.plug.name} plug`,
        this.plug.componentId,
        { cause: Crash.from(rawError, this.plug.componentId) }
      );
      this.onOperationError(error);
      throw rawError;
    }
  }
  /**
   * Perform the task to clean the job registers after the job has been resolved
   * @param jobId - Job entry identification
   * @returns - the job entry identification that has been correctly removed or undefined if the job
   * was not found
   */
  private readonly postConsume = async (jobId: string): Promise<string | undefined> => {
    try {
      // Post consume operation is only retried one time, if it fails the job is registered
      // as uncleaned and will be removed in the next check
      const result = await this.wrappedOperation(this.postConsumeOriginal, [jobId], {
        ...this.retryOptions,
        attempts: 1,
      });
      if (!result) {
        this.unknownEntries.push(jobId);
        if (this.unknownEntries.length > this.postConsumeOptions.maxUnknownJobs) {
          this.unknownEntries.shift();
        }
      }
      return result;
    } catch (rawError) {
      const error = Crash.from(rawError, this.plug.componentId);
      this.uncleanedEntries.push(jobId);
      this.startUncleanedCheckInterval();
      throw error;
    }
  };
  /** Perform the ingestion of new data */
  private readonly ingestData = async (size?: number): Promise<any> => {
    if (!this.ingestDataOriginal) {
      throw new Crash(`Plug ${this.plug.name} does not implement the ingestData method`);
    }
    // Ingest data operation is retried infinitely using the default values, in other way the normal
    // ingestion process will be blocked
    return this.wrappedOperation(this.ingestDataOriginal, [size]);
  };
  /**
   * Return the status of the stream in a standard format
   * @returns _check object_ as defined in the draft standard
   * https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check-05
   */
  public get checks(): Health.API.Checks {
    return {
      ...this.plug.checks,
      [`${this.plug.name}:unknownJobsInPostConsume`]: this.getRegisterHealthCheck(
        this.unknownEntries,
        'unknown jobs'
      ),
      [`${this.plug.name}:uncleanedJobsInPostConsume`]: this.getRegisterHealthCheck(
        this.uncleanedEntries,
        'uncleaned jobs'
      ),
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
