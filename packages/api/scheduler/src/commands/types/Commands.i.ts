/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { RetryOptions, TaskArguments, TaskAsPromise } from '@mdf.js/utils';
import { Instance } from '../Instance';
import { MultiInstance } from '../MultiInstance';

export type AnyResult = Record<string, any> | number | string | boolean | null;

/** Base output of a Command */
export interface Output {
  /** Metadata with information related to the execution of the command */
  $meta: MetaData;
}

export interface CommandResult<Result extends AnyResult = null> extends Output {
  result: Result;
}

/** Represents a step of a sequence */
export interface Step<Result extends AnyResult = null, U = any> {
  /** Task to be executed */
  task: TaskAsPromise<CommandResult<Result>>;
  /** Context to be bind to the task */
  bind?: U;
  /** Arguments to be passed to the task */
  args?: TaskArguments;
  /** Options to be passed to the task */
  options?: RetryOptions;
}

/** Base input to execute commands */
export interface Input {
  /** Universally Unique IDentifier  of the command */
  uuid?: string;
  /** Limit time to execute the command. If undefined the command has no limit to be completed */
  limitTime?: number;
}

/** Represents the options of a sequence */
export interface SequenceOptions<Result extends AnyResult> extends Input {
  pre?: Step<any>[];
  post?: Step<any>[];
  command: Step<Result>;
  finally?: Step<any>[];
}

export type Status = 'completed' | 'cancelled' | 'failed' | 'pending' | 'running';

/** Metadata of the execution of the command */
export interface MetaData {
  /** Command Unique Unit IDentifier */
  uuid: string;
  /** Name of the command */
  command: string;
  /** Status of the execution successful execution or failed execution */
  status: Status;
  /** Date when the command was executed in ISO format */
  executedAt?: string;
  /** Date when the command was completed in ISO format */
  completedAt?: string;
  /** Date when the command was cancelled in ISO format */
  cancelledAt?: string;
  /** Date when the command was failed in ISO format  */
  failedAt?: string;
  /** Duration */
  duration?: number;
  /** Reason of why the execution was failed in case it was failed */
  reason?: string;
  /** Additional metadata in case the execution required execute other commands */
  $meta?: MetaData[];
}

export type AnyCommand<
  Options extends { [x: string]: any } = Record<string, never>,
  Results extends { [x: string]: any } = Record<string, never>,
> = Instance<Options, Results> | MultiInstance<Options, Results>;
