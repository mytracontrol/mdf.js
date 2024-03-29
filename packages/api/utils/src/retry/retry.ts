/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Boom, Crash, Multi } from '@mdf.js/crash';

export const WAIT_TIME = 100;
export const MAX_WAIT_TIME = 15000;
export type LoggerFunction = (error: Crash | Multi | Boom) => void;
const DEFAULT_RETRY_OPTIONS = {
  logger: undefined,
  waitTime: WAIT_TIME,
  maxWaitTime: MAX_WAIT_TIME,
  interrupt: undefined,
  attempts: Number.MAX_SAFE_INTEGER,
  actualAttempt: 1,
};

export interface RetryOptions {
  logger?: LoggerFunction;
  waitTime?: number;
  maxWaitTime?: number;
  interrupt?: () => boolean;
  attempts?: number;
}

interface RetryParameters {
  logger?: LoggerFunction;
  waitTime: number;
  maxWaitTime: number;
  interrupt?: () => boolean;
  attempts: number;
  actualAttempt: number;
}

/**
 * Auxiliar function to perform the wait process
 * @param delay - time in milliseconds to wait for retry
 * @returns
 */
const wait = (delay: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, delay));
};
/**
 * Log the error if there is an logger instance
 * @param error - error to be logged
 * @param loggerFunc - logger function
 */
const logging = (error: Crash | Multi | Boom, loggerFunc?: LoggerFunction) => {
  if (loggerFunc) {
    loggerFunc(error);
  }
};

/**
 * Calculate the new wait time for the next call
 * @param actualWaitTime - Actual wait time
 * @param maxWaitTime - Max wait time
 * @param actualAttempt - actual function call attempts
 * @returns
 */
const calculateWaitTime = (actualWaitTime: number, maxWaitTime: number, actualAttempt: number) => {
  return actualWaitTime + actualAttempt * WAIT_TIME > maxWaitTime
    ? maxWaitTime
    : actualWaitTime + actualAttempt * WAIT_TIME;
};

/**
 * Manage an error in one of the tries
 * @param rawError - Error to be managed
 * @param parameters - retry parameters
 */
async function errorManagement(
  rawError: unknown,
  parameters: RetryParameters
): Promise<RetryParameters> {
  const error = Crash.from(rawError);
  logging(error, parameters.logger);
  if (parameters.interrupt && parameters.interrupt()) {
    throw new Crash(`The loop process was interrupted externally`, error.uuid, {
      name: 'InterruptionError',
      cause: error,
    });
  }
  if (parameters.actualAttempt >= parameters.attempts) {
    throw new Crash(
      `Too much attempts [${parameters.actualAttempt}], the promise will not be retried`,
      error.uuid,
      { name: 'InterruptionError', cause: error }
    );
  }
  if (error.name === 'IrresolvableError') {
    throw new Crash(`An irresolvable error was the cause of the interruption`, error.uuid, {
      name: 'InterruptionError',
      cause: error,
    });
  }
  await wait(parameters.waitTime);
  parameters.waitTime = calculateWaitTime(
    parameters.waitTime,
    parameters.maxWaitTime,
    parameters.actualAttempt
  );
  parameters.actualAttempt += 1;
  return parameters;
}

/**
 * Perform the retry functionality for a promise
 * @param task - promise to execute
 * @param bindTo - instance to be binded to the task
 * @param funcArgs - promise arguments
 * @param options - control execution options
 * @returns
 */
export const retryBind = async <T, U>(
  task: (...args: any[]) => Promise<T>,
  bindTo: U,
  funcArgs: any[] = [],
  options: RetryOptions = {}
): Promise<T> => {
  const parameters = { ...DEFAULT_RETRY_OPTIONS, ...options };
  try {
    return await task.bind(bindTo).apply(task, funcArgs);
  } catch (error) {
    return retryBind(task, bindTo, funcArgs, await errorManagement(error, parameters));
  }
};

/**
 * Perform the retry functionality for a promise
 * @param task - promise to execute
 * @param funcArgs - promise arguments
 * @param options - control execution options
 * @returns
 */
export const retry = async <T>(
  task: (...args: any[]) => Promise<T>,
  funcArgs: any[] = [],
  options: RetryOptions = {}
): Promise<T> => {
  const parameters = { ...DEFAULT_RETRY_OPTIONS, ...options };
  try {
    return await task.apply(task, funcArgs);
  } catch (error: unknown) {
    return retry(task, funcArgs, await errorManagement(error, parameters));
  }
};
