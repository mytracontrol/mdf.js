/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash, Multi } from '@mdf.js/crash';
import { RetryOptions } from '@mdf.js/utils';
import { EventEmitter } from 'events';
import { cloneDeep } from 'lodash';
import { v4 } from 'uuid';
import {
  DEFAULT_PRIORITY,
  DEFAULT_RETRY_OPTIONS,
  DEFAULT_RETRY_STRATEGY,
  DEFAULT_WEIGHT,
  MetaData,
  RETRY_STRATEGY,
  RetryStrategy,
  TASK_STATE,
  TaskOptions,
  TaskState,
} from './types';

/** Represents the task handler */
export declare interface TaskHandler<T, U> {
  /** Emitted when a task has ended */
  on(
    event: 'done',
    listener: (uuid: string, result: T, meta: MetaData, error?: Crash) => void
  ): this;
}

/** Represents the task handler */
export abstract class TaskHandler<T = any, U = any> extends EventEmitter {
  /** Unique task identification, unique for each task */
  public readonly uuid: string;
  /** Task identifier, defined by the user */
  public readonly taskId: string;
  /** Date when the task was created */
  public readonly createdAt: Date;
  /** Date when the task was executed in ISO format */
  protected executedAt?: Date;
  /** Date when the task was completed in ISO format */
  protected completedAt?: Date;
  /** Date when the task was cancelled in ISO format */
  protected cancelledAt?: Date;
  /** Date when the task was failed in ISO format  */
  protected failedAt?: Date;
  /** Reason of failure or cancellation */
  protected _reason?: string;
  /** Additional metadata in case the execution required execute other tasks */
  protected readonly _$meta: MetaData[] = [];
  /** Task priority */
  public readonly priority: number;
  /** Task weight */
  public readonly weight: number;
  /** Status of the task */
  private status: TaskState = TASK_STATE.PENDING;
  /** Retry options */
  protected retryOptions: RetryOptions;
  /** Context to be bind to the task */
  protected context?: U;
  /** Result of the task */
  private result?: T;
  /** Strategy to retry the task */
  private readonly strategy: RetryStrategy;
  /**
   * Create a new task handler
   * @param options - The options for the task
   */
  constructor(options: TaskOptions<U> = {}) {
    super();
    this.uuid = v4();
    this.createdAt = new Date();
    this.priority = options.priority ?? DEFAULT_PRIORITY;
    this.weight = options.weight ?? DEFAULT_WEIGHT;
    this.taskId = options.id || v4();
    this.retryOptions = options.retryOptions || DEFAULT_RETRY_OPTIONS;
    this.context = options.bind;
    this.strategy = options.retryStrategy || DEFAULT_RETRY_STRATEGY;
  }
  /**
   * Get the cause of the error
   * @param error - The error to get the cause
   * @returns The cause of the error
   */
  private getCause(error: Crash | Multi): string {
    //Erro from group of tasks
    if (error instanceof Multi) {
      return error.trace().join(',\n') || error.message;
    } //Error from retry or retryBind
    else if (error.name === 'InterruptionError' || error.name === 'AbortError') {
      return error.cause ? error.cause.message : error.message;
    } //Error from task or sequence phase
    else {
      return error.message;
    }
  }
  /**
   * Execute the task
   * @returns The result of the task
   */
  private shouldBeExecuted(): boolean {
    // Execute the task if it is pending
    if (this.status === TASK_STATE.PENDING) {
      this.status = TASK_STATE.RUNNING;
      this.executedAt = new Date();
      return true;
    }
    switch (this.strategy) {
      case RETRY_STRATEGY.FAIL_AFTER_EXECUTED:
        this.onRetry();
        this.onError(
          new Crash(
            `Task [${this.taskId}] was executed previously, you can't execute it again due to the retry strategy.`,
            this.uuid,
            { info: this.metadata }
          )
        );
      case RETRY_STRATEGY.NOT_EXEC_AFTER_SUCCESS:
        if (this.status === TASK_STATE.COMPLETED) {
          return false;
        }
        this.onRetry();
        return true;
      case RETRY_STRATEGY.FAIL_AFTER_SUCCESS:
        if (this.status === TASK_STATE.COMPLETED) {
          this.onRetry();
          this.onError(
            new Crash(
              `Task [${this.taskId}] was previously executed successfully, you can't execute it again due to the retry strategy.`,
              this.uuid,
              { info: this.metadata }
            )
          );
        }
        this.onRetry();
        return true;
      case RETRY_STRATEGY.RETRY:
      default:
        this.onRetry();
        return true;
    }
  }
  /**
   * Handle the error
   * @param rawError - The error to handle
   * @returns The error
   */
  private onError(rawError: Crash | Multi): never {
    const cause = Crash.from(rawError);
    this.status = cause.name === 'AbortError' ? TASK_STATE.CANCELLED : TASK_STATE.FAILED;
    if (this.status === TASK_STATE.CANCELLED) {
      this.cancelledAt = new Date();
    } else {
      this.failedAt = new Date();
    }
    this._reason = `Execution error in task [${this.taskId}]: ${this.getCause(cause)}`;
    const error = new Crash(this._reason, this.uuid, { cause, info: this.metadata });
    this.done(undefined, error);
    throw error;
  }
  /**
   * Handle the success
   * @param result - The result of the task
   * @returns The result
   */
  private onSuccess(result: T): T {
    this.status = TASK_STATE.COMPLETED;
    this.completedAt = new Date();
    this.result = result;
    this.done(this.result);
    return result;
  }
  /** Handle the retry */
  private onRetry(): void {
    this._$meta.push(cloneDeep(this.metadata));
    this.status = TASK_STATE.PENDING;
    this.executedAt = new Date();
    this._reason = undefined;
    this.completedAt = undefined;
    this.cancelledAt = undefined;
    this.failedAt = undefined;
  }
  /** Return the duration of the task */
  private get duration(): number {
    const executedAt = this.executedAt?.getTime();
    const completedAt =
      this.completedAt?.getTime() || this.cancelledAt?.getTime() || this.failedAt?.getTime();
    if (!executedAt || !completedAt) {
      return -1;
    }
    return completedAt - executedAt;
  }
  /** Notify that the task has been processed */
  private done(result?: T, error?: Multi | Crash): void {
    if (this.listenerCount('done') <= 0) {
      return;
    }
    this.emit('done', this.uuid, result, this.metadata, error);
  }
  /** Return the metadata of the task */
  public get metadata(): MetaData {
    return {
      uuid: this.uuid,
      taskId: this.taskId,
      status: this.status,
      createdAt: this.createdAt.toISOString(),
      executedAt: this.executedAt?.toISOString(),
      completedAt: this.completedAt?.toISOString(),
      cancelledAt: this.cancelledAt?.toISOString(),
      failedAt: this.failedAt?.toISOString(),
      reason: this._reason,
      duration: this.duration,
      priority: this.priority,
      weight: this.weight,
      $meta: this._$meta,
    };
  }
  /** Execute the task */
  public async execute(): Promise<T> {
    if (this.shouldBeExecuted()) {
      return this._execute().then(this.onSuccess.bind(this)).catch(this.onError.bind(this));
    }
    return this.result as T;
  }
  /** Cancel the task */
  public cancel(error?: Crash): void {
    const cause = error || new Crash(`Task [${this.taskId}] was cancelled by the user`, this.uuid);
    cause.name = 'AbortError';
    try {
      this.onError(cause);
    } catch {
      // Do nothing
    }
  }
  /** Execute the underlayer execution strategy */
  protected abstract _execute(): Promise<T>;
}
