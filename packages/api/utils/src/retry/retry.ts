/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Boom, Crash, Multi } from '@mdf.js/crash';
import timers from 'timers/promises';

/**
 * The wait time in milliseconds for retrying an operation.
 */
export const WAIT_TIME = 100;
/**
 * Maximum wait time in milliseconds for retrying an operation.
 */
export const MAX_WAIT_TIME = 15000;
/**
 * Represents a function that logs errors.
 * @param error - The error to be logged.
 */
export type LoggerFunction = (error: Crash | Multi | Boom) => void;

/**
 * Type definition for the arguments of a task function.
 */
export type TaskArguments = any[];

/**
 * Represents a task that returns a promise.
 * @template R The type of the result returned by the task.
 */
export type TaskAsPromise<R> = (...args: TaskArguments) => Promise<R>;

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
   * @deprecated User `abortSignal` instead
   */
  interrupt?: () => boolean;
  /** The signal to be used to interrupt the retry process */
  abortSignal?: AbortSignal;
  /** The maximum number of retry attempts. */
  attempts?: number;
  /** Timeout for each try */
  timeout?: number;
}

/** Represents the parameters for retrying an operation */
interface RetryParameters
  extends Required<Omit<RetryOptions, 'logger' | 'interrupt' | 'timeout' | 'abortSignal'>> {
  /** The logger function used for logging retry attempts */
  logger?: LoggerFunction;
  /**
   * A function that determines whether to interrupt the retry process
   * Should return true to interrupt, false otherwise.
   * @deprecated User `abortSignal` instead
   */
  interrupt?: () => boolean;
  /** The actual number of retry attempts. */
  actualAttempt: number;
  /** Timeout for each try */
  timeout?: number;
  /** The promise that will be rejected if the task is aborted */
  abortPromise?: Promise<never> | null;
}

/** Default retry options for retrying operations */
const DEFAULT_RETRY_OPTIONS: RetryParameters = {
  logger: undefined,
  waitTime: WAIT_TIME,
  maxWaitTime: MAX_WAIT_TIME,
  interrupt: undefined,
  attempts: Number.MAX_SAFE_INTEGER,
  actualAttempt: 1,
  abortPromise: null,
  timeout: undefined,
};

/**
 * Auxiliar function to perform the wait process
 * @param delay - time in milliseconds to wait for retry
 * @returns
 */
const wait = (delay: number): Promise<void> => {
  return timers.setTimeout(delay);
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
      throw new Crash(`The execution of the try number ${attempts} has timed out: ${timeout} ms`, {
        name: 'TimeoutError',
        info: { timeout },
      });
    });
  }
};

/**
 * Auxiliar function to create the abort promise
 * @param attempts - actual function call attempts
 * @param signal - signal to be used for the timeout
 */
const abortCancelSignal = (attempts: number, signal: AbortSignal): Promise<never> => {
  return new Promise((resolve, reject) => {
    signal.addEventListener(
      'abort',
      () => {
        const cause = signal.reason ? Crash.from(signal.reason) : undefined;
        reject(
          new Crash(`The task was aborted externally in attempt number: ${attempts}`, {
            name: 'InterruptionError',
            cause,
          })
        );
      },
      { once: true }
    );
  });
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
  if (error.name === 'InterruptionError') {
    throw error;
  }
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
  task: TaskAsPromise<T>,
  bindTo: U,
  funcArgs: TaskArguments = [],
  options: RetryOptions = {}
): Promise<T> => {
  const parameters = { ...DEFAULT_RETRY_OPTIONS, ...options };
  if (options.abortSignal && !parameters.abortPromise) {
    parameters.abortPromise = abortCancelSignal(parameters.actualAttempt, options.abortSignal);
  }
  const controller = new AbortController();
  try {
    const result = await Promise.race(
      [
        task.bind(bindTo).apply(task, funcArgs),
        watchdog(controller.signal, parameters.actualAttempt, parameters.timeout),
        parameters.abortPromise,
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
  task: TaskAsPromise<T>,
  funcArgs: TaskArguments = [],
  options: RetryOptions = {}
): Promise<T> => {
  const parameters = { ...DEFAULT_RETRY_OPTIONS, ...options };
  if (options.abortSignal && !parameters.abortPromise) {
    parameters.abortPromise = abortCancelSignal(parameters.actualAttempt, options.abortSignal);
  }
  const controller = new AbortController();
  try {
    const result = await Promise.race(
      [
        task.apply(task, funcArgs),
        watchdog(controller.signal, parameters.actualAttempt, parameters.timeout),
        parameters.abortPromise,
      ].filter(Boolean)
    );
    controller.abort();
    return result as T;
  } catch (error: unknown) {
    controller.abort();
    return retry(task, funcArgs, await errorManagement(error, parameters));
  }
};

/**
 * Wraps a task with retry functionality.
 * @param task - The task to be executed.
 * @param funcArgs - The arguments to be passed to the task.
 * @param options - The options for retry behavior.
 * @returns - A function that, when called, executes the task with retry.
 */
export const wrapOnRetry = <T>(
  task: TaskAsPromise<T>,
  funcArgs: TaskArguments = [],
  options: RetryOptions = {}
): (() => Promise<T>) => {
  const parameters = { ...DEFAULT_RETRY_OPTIONS, ...options };
  return async (): Promise<T> => {
    return retry(task, funcArgs, parameters);
  };
};
