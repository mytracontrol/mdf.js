/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Represents the strategy to retry a task */
export enum RETRY_STRATEGY {
  /** The task will allow to be executed again if it fails, updating the metadata in each retry */
  RETRY = 'retry',
  /**
   * The task will allow to be executed again if it fails, but it will rejects if there are more
   * retries before the success
   */
  FAIL_AFTER_SUCCESS = 'failAfterSuccess',
  /** The task will allow only one execution, if it fails, it will fail in every retry */
  FAIL_AFTER_EXECUTED = 'failAfterExecuted',
  /**
   * The task will resolve the result of first successful execution, if it fails, it will allow to
   * be executed again
   */
  NOT_EXEC_AFTER_SUCCESS = 'notExecAfterSuccess',
}

/** Represents the strategy to retry a task */
export type RetryStrategy =
  | RETRY_STRATEGY.FAIL_AFTER_EXECUTED
  | RETRY_STRATEGY.FAIL_AFTER_SUCCESS
  | RETRY_STRATEGY.NOT_EXEC_AFTER_SUCCESS
  | RETRY_STRATEGY.RETRY;
