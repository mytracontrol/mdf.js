/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { v4 } from 'uuid';
import { Instance } from './Instance';
import { AnyResult, CommandResult, Input, MetaData, Output, Status } from './types';

export class MultiInstance<
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
  /** Date when the command was failed */
  private _failedAt?: Date;
  /** Reason of why the command was failed */
  private _reason?: string;
  /** Additional metadata in case the execution required execute other commands */
  private readonly _$meta: MetaData[];
  /** Results of the sequence */
  private readonly results: Results[] = [];
  /**
   * Create a new sequence instance
   * @param command - Command name
   * @param options - Command options
   */
  constructor(
    public readonly sequence: string,
    protected readonly options: Input,
    protected readonly commands: Instance<Options, Results>[]
  ) {
    this.uuid = options.uuid || v4();
    if (commands.length === 0) {
      throw new Crash(`The sequence [${sequence}] is empty`, this.uuid);
    }
    this._$meta = [];
  }
  /** Execute the sequence */
  public async execute(): Promise<Output & { results: Results[] }> {
    this._status = 'running';
    this._executedAt = new Date();
    for (const command of this.commands) {
      const result = await this.unitaryExecution(command);
      this._$meta.push(result.$meta);
      if ('result' in result) {
        this.results.push(result.result);
      }
    }
    if (this._$meta.some(meta => meta.status === 'failed')) {
      this._status = 'failed';
      this._failedAt = new Date();
      this._reason = 'At least one of the commands failed';
    } else {
      this._status = 'completed';
      this._completedAt = new Date();
    }
    return {
      $meta: this.metadata,
      results: this.results,
    };
  }
  /**
   * Wrap a command execution to be performed one by one
   * @param instance - command instance to be executed
   * @returns
   */
  public async unitaryExecution(
    instance: Instance<Options, Results>
  ): Promise<CommandResult<Results>> {
    try {
      return await instance.execute();
    } catch (rawError) {
      const cause = Crash.from(rawError);
      return { $meta: cause.info as unknown as MetaData, result: null as Results };
    }
  }
  /** Return the duration of the command */
  private get duration(): number {
    if (!this._executedAt) {
      return 0;
    }
    const executedAt = this._executedAt.getTime();
    const completedAt = this._completedAt?.getTime() || this._failedAt?.getTime();
    return completedAt ? completedAt - executedAt : -1;
  }
  /** Return the metadata information of the command */
  private get metadata(): MetaData {
    return JSON.parse(
      JSON.stringify({
        uuid: this.uuid,
        command: this.sequence,
        status: this._status,
        executedAt: this._executedAt?.toISOString(),
        completedAt: this._completedAt?.toISOString(),
        failedAt: this._failedAt?.toISOString(),
        duration: this.duration,
        reason: this._reason,
        $meta: this._$meta,
      })
    );
  }
}
