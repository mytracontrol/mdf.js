/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';

export interface TimeoutOptions<ReturnType> {
  /**
   * The number of milliseconds before the promise is rejected.
   *  If not specified, the returned promise will not be rejected.
   * @default `Infinity`
   */
  milliseconds: number;
  /**
   * Do something when the promise is rejected due to the timeout, for example retry.
   * @example
   * ```ts
   * const run = async () => {
   *  try {
   *    await pTimeout(somePromise(), 1000, {
   *      onTimeout: () => {
   *        console.log('timeout');
   *      }
   *    });
   *  } catch (error) {
   *    console.log(error);
   *  }
   * };
   * run();
   * ```
   */
  fallback?: () => ReturnType | Promise<ReturnType>;
  /**
   * The error message when the promise is rejected due to the timeout.
   * @default `Promise timed out after ${milliseconds} milliseconds`
   */
  message?: string | Crash | false;
  /**
   * The signal to abort the promise when the timeout is reached.
   * @default `undefined`
   */
  signal?: AbortSignal;
}

/**
 * A promise that rejects when the specified timeout is reached.
 * @param task - The promise
 * @param options - The options
 * @returns A promise that rejects when the specified timeout is reached
 */
export function pTimeout<T>(
  task: Promise<T>,
  options: TimeoutOptions<T>
): Promise<T> & { cancel: () => void } {
  if (typeof options.milliseconds !== 'number' || Math.sign(options.milliseconds) !== 1) {
    throw new Crash('Expected `milliseconds` to be a positive number');
  }
  if (options.signal && !('aborted' in options.signal)) {
    throw new Crash('Expected `signal` to be an AbortSignal');
  }
  if (options.fallback && typeof options.fallback !== 'function') {
    throw new Crash('Expected `fallback` to be a function');
  }
  if (
    options.message &&
    typeof options.message !== 'boolean' &&
    typeof options.message !== 'string' &&
    !(options.message instanceof Crash)
  ) {
    throw new Crash('Expected `message` to be a string, boolean, or Crash');
  }
  let timer: NodeJS.Timeout | undefined;
  let cancel: () => void;
  let answered = false;
  const wrappedPromise = new Promise<T>((resolve, reject) => {
    if (options.signal) {
      const signal = options.signal;
      if (signal.aborted) {
        const error = options.signal.reason
          ? Crash.from(options.signal.reason)
          : new Crash('The operation was aborted', { name: 'AbortError' });
        reject(error);
      }
      signal.addEventListener(
        'abort',
        () => {
          const error = signal.reason
            ? Crash.from(signal.reason)
            : new Crash('The operation was aborted', { name: 'AbortError' });
          reject(error);
        },
        { once: true }
      );
    }
    if (options.milliseconds === Number.POSITIVE_INFINITY) {
      task.then(resolve, reject);
      return;
    }
    cancel = () => {
      if (timer) {
        clearTimeout(timer);
        timer = undefined;
      }
      if (!answered) {
        reject(new Crash('Promise was canceled', { name: 'AbortError' }));
        answered = true;
      }
    };
    const onTimeout = () => {
      if (options.fallback) {
        resolve(options.fallback());
      } else if (options.message === false) {
        reject(new Crash('Promise timed out', { name: 'TimeoutError' }));
      } else if (options.message instanceof Crash) {
        reject(Crash.from(options.message));
      } else {
        reject(
          new Crash(
            options.message || `Promise timed out after ${options.milliseconds} milliseconds`,
            { name: 'TimeoutError' }
          )
        );
      }
      answered = true;
    };
    const onRevolve = (value: T) => {
      if (timer) {
        clearTimeout(timer);
        timer = undefined;
      }
      if (!answered) {
        resolve(value);
        answered = true;
      }
    };
    const onReject = (error: any) => {
      if (timer) {
        clearTimeout(timer);
        timer = undefined;
      }
      if (!answered) {
        reject(Crash.from(error));
        answered = true;
      }
    };
    timer = setTimeout(onTimeout, options.milliseconds);
    task.then(onRevolve, onReject);
  }) as Promise<T> & { cancel: () => void };
  wrappedPromise.cancel = cancel!;
  return wrappedPromise as Promise<T> & { cancel: () => void };
}
