/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { retry, retryBind } from '@mdf.js/utils';
import { v4 } from 'uuid';
import { AnyResult, CommandResult, MetaData, SequenceOptions, Status, Step } from './types';

export class Sequence<T extends AnyResult> {
  /** Universally Unique IDentifier  of the command */
  public readonly uuid: string;
  /** Status of the command */
  private _status: Status = 'pending';
  /** Date when the command was executed */
  private _executedAt?: Date;
  /** Date when the command was completed */
  private _completedAt?: Date;
  /** Date when the command was cancelled */
  private _cancelledAt?: Date;
  /** Date when the command was failed */
  private _failedAt?: Date;
  /** Reason of why the command was failed */
  private _reason?: string;
  /** Additional metadata in case the execution required execute other commands */
  private readonly _$meta: MetaData[] = [];
  /**
   * Create a new sequence instance
   * @param sequence - Sequence name
   * @param options - Options of the sequence
   */
  constructor(
    public readonly sequence: string,
    protected readonly options: SequenceOptions<T>
  ) {
    this.uuid = options.uuid || v4();
  }
  /** Execute the command */
  public async execute(): Promise<CommandResult<T>> {
    this._status = 'running';
    this._executedAt = new Date();
    return new Promise(async (resolve, reject) => {
      const onTimeout = () => {
        this._status = 'cancelled';
        this._cancelledAt = new Date();
        this._reason = `Execution timeout in sequence: [${this.sequence}]: ${this.duration}ms`;
        reject(new Crash(this._reason, this.uuid, { info: this.metadata }));
      };
      if (typeof this.options.limitTime === 'number' && this.options.limitTime > 0) {
        setTimeout(onTimeout, this.options.limitTime);
      }
      try {
        await this.processSteps(this.options.pre || []);
        const result = await this.unitaryExecution(this.options.command);
        this._$meta.push(result.$meta);
        await this.processSteps(this.options.post || []);
        await this.processSteps(this.options.finally || []);
        resolve(this.onCompleted(result));
      } catch (rawError) {
        const error = Crash.from(rawError);
        if (error instanceof Crash && error.cause instanceof Crash) {
          this._$meta.push(error.cause.info as unknown as MetaData);
        }
        await this.processSteps(this.options.finally || []);
        reject(this.onFail(error));
      }
    });
  }
  /**
   * Process the steps of the sequence
   * @param options - Options of the sequence
   * @param results - Results of the sequence
   */
  private async processSteps(steps: Step<any>[]): Promise<void> {
    for (const step of steps) {
      this._$meta.push((await this.unitaryExecution(step)).$meta);
    }
  }
  /**
   * Wrap a command execution to be performed one by one
   * @param instance - command instance to be executed
   * @returns
   */
  private async unitaryExecution(step: Step<T>): Promise<CommandResult<T>> {
    let result: CommandResult<T>;
    if (step.bind) {
      result = await retryBind(step.task, step.bind, step.args, step.options);
    } else {
      result = await retry(step.task, step.args, step.options);
    }
    return result;
  }
  /** Manage the result of a successful task execution */
  private readonly onCompleted = (result: CommandResult<T>): CommandResult<T> => {
    this._status = 'completed';
    this._completedAt = new Date();
    return { $meta: this.metadata, result: result.result };
  };
  /**
   * Manage the error in command execution
   * @param rawError - Error to manage
   */
  private readonly onFail = (rawError: any): Crash => {
    const cause = Crash.from(rawError);
    this._status = 'failed';
    this._failedAt = new Date();
    this._reason = `Execution error in sequence: [${this.sequence}]: ${cause.message}`;
    return new Crash(this._reason, this.uuid, { cause, info: this.metadata });
  };
  /** Return the duration of the command */
  private get duration(): number {
    if (!this._executedAt) {
      return 0;
    }
    const executedAt = this._executedAt.getTime();
    const completedAt =
      this._completedAt?.getTime() || this._cancelledAt?.getTime() || this._failedAt?.getTime();
    return completedAt ? completedAt - executedAt : -1;
  }
  /** Return the metadata information of the sequence */
  private get metadata(): MetaData {
    return JSON.parse(
      JSON.stringify({
        uuid: this.uuid,
        command: this.sequence,
        status: this._status,
        executedAt: this._executedAt?.toISOString(),
        completedAt: this._completedAt?.toISOString(),
        cancelledAt: this._cancelledAt?.toISOString(),
        failedAt: this._failedAt?.toISOString(),
        duration: this.duration,
        reason: this._reason,
        $meta: this._$meta,
      })
    );
  }
}
