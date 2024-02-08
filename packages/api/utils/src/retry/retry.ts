/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Boom, Crash, Multi } from '@mdf.js/crash';
import timers from 'timers/promises';

export const WAIT_TIME = 100;
export const MAX_WAIT_TIME = 15000;
export type LoggerFunction = (error: Crash | Multi | Boom) => void;

/** Represents the options for retrying an operation */
export interface RetryOptions {
  /** The logger function used for logging retry attempts */
  logger?: LoggerFunction;
  /** The time to wait between retry attempts, in milliseconds */
  waitTime?: number;
  /** The maximum time to wait between retry attempts, in milliseconds */
  maxWaitTime?: number;
  /**
   * A function that determines whether to interrupt the retry process
   * Should return true to interrupt, false otherwise.
   */
  interrupt?: () => boolean;
  /** The maximum number of retry attempts. */
  attempts?: number;
  /** Timeout for each try */
  timeout?: number;
}

/** Represents the parameters for retrying an operation */
interface RetryParameters extends Required<Omit<RetryOptions, 'logger' | 'interrupt' | 'timeout'>> {
  /** The logger function used for logging retry attempts */
  logger?: LoggerFunction;
  /**
   * A function that determines whether to interrupt the retry process
   * Should return true to interrupt, false otherwise.
   */
  interrupt?: () => boolean;
  /** The actual number of retry attempts. */
  actualAttempt: number;
  /** Timeout for each try */
  timeout?: number;
}

const DEFAULT_RETRY_OPTIONS: RetryParameters = {
  logger: undefined,
  waitTime: WAIT_TIME,
  maxWaitTime: MAX_WAIT_TIME,
  interrupt: undefined,
  attempts: Number.MAX_SAFE_INTEGER,
  actualAttempt: 1,
  timeout: undefined,
};

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
 * Auxiliar function to create the watchdog promise for the timeout
 * @param signal - signal to be used for the timeout
 * @param attempts - actual function call attempts
 * @param timeout - time in milliseconds to wait for retry
 */
const watchdog = (signal: AbortSignal, attempts: number, timeout?: number) => {
  if (timeout === undefined) {
    return null;
  } else {
    return timers.setTimeout(timeout, undefined, { signal }).then(() => {
      throw new Crash(`The execution of the try number ${attempts} has timed out`, {
        name: 'TimeoutError',
        info: { timeout },
      });
    });
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
  const controller = new AbortController();
  try {
    const result = await Promise.race(
      [
        task.bind(bindTo).apply(task, funcArgs),
        watchdog(controller.signal, parameters.actualAttempt, parameters.timeout),
      ].filter(Boolean)
    );
    controller.abort();
    return result as T;
  } catch (error) {
    controller.abort();
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
  const controller = new AbortController();
  try {
    const result = await Promise.race(
      [
        task.apply(task, funcArgs),
        watchdog(controller.signal, parameters.actualAttempt, parameters.timeout),
      ].filter(Boolean)
    );
    controller.abort();
    return result as T;
  } catch (error: unknown) {
    controller.abort();
    return retry(task, funcArgs, await errorManagement(error, parameters));
  }
};
