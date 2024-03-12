/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { v4 } from 'uuid';
import { AnyResult, CommandResult, Input, MetaData, Status } from './types';

export abstract class Instance<
  Options extends { [x: string]: any } = Record<string, never>,
  Results extends AnyResult = null,
> {
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
  /**
   * Wrap a promise in a command instance
   * @param command - Command name
   * @param promise - Promise to wrap
   * @param uuid - Universally Unique IDentifier of the command
   */
  static runAsCommand<T extends AnyResult = null>(
    command: string,
    promise: (uuid: string) => Promise<T>,
    uuid: string
  ): Promise<CommandResult<T>> {
    class Command extends Instance<Input, T> {
      constructor(
        name: string,
        options: Input,
        protected readonly wrappedTask: (uuid: string) => Promise<T>
      ) {
        super(name, options);
      }
      protected async task(): Promise<T> {
        return this.wrappedTask(this.uuid);
      }
    }
    return new Command(command, { uuid }, promise).execute();
  }
  /** Additional metadata in case the execution required execute other commands */
  private readonly _$meta?: MetaData[];
  /**
   * Create a new command instance
   * @param command - Command name
   * @param options - Command options
   */
  constructor(
    public readonly command: string,
    protected readonly options: Input & Options
  ) {
    this.uuid = options.uuid || v4();
  }
  /** Execute the command */
  public async execute(): Promise<CommandResult<Results>> {
    this._status = 'running';
    this._executedAt = new Date();
    return new Promise((resolve, reject) => {
      const onTimeout = () => {
        this._status = 'cancelled';
        this._cancelledAt = new Date();
        this._reason = `Execution timeout in command: [${this.command}]: ${this.duration}ms`;
        reject(new Crash(this._reason, this.uuid, { info: this.metadata }));
      };
      if (typeof this.options.limitTime === 'number' && this.options.limitTime > 0) {
        setTimeout(onTimeout, this.options.limitTime);
      }
      this.task(this.options)
        .then(results => {
          resolve(this.onCompleted(results));
        })
        .catch(rawError => {
          reject(this.onFail(rawError));
        });
    });
  }
  /** Manage the result of a successful task execution */
  private readonly onCompleted = (results: Results): CommandResult<Results> => {
    this._status = 'completed';
    this._completedAt = new Date();
    return { $meta: this.metadata, result: results };
  };
  /**
   * Manage the error in command execution
   * @param rawError - Error to manage
   */
  private readonly onFail = (rawError: unknown): Crash => {
    const cause = Crash.from(rawError);
    this._status = 'failed';
    this._failedAt = new Date();
    this._reason = `Execution error in command: [${this.command}]: ${cause.message}`;
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
  /** Return the metadata information of the command */
  private get metadata(): MetaData {
    return JSON.parse(
      JSON.stringify({
        uuid: this.uuid,
        command: this.command,
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
  /**
   * Perform the task of the command
   * @param options - C
   */
  protected abstract task(options: Input & Options): Promise<Results>;
}
