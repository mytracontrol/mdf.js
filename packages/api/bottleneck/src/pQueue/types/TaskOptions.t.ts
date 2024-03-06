/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

export type TaskOptions = {
  /**
   * [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) for cancellation
   * of the operation. When aborted, it will be removed from the queue and the `queue.add()` call
   * will reject with an `AbortError`. If the operation is already running, the signal will need to
   * be handled by the operation itself.
   * @example
   * ```ts
   * import PQueue, {AbortError} from 'p-queue';
   * import got, {CancelError} from 'got';
   *
   * const queue = new PQueue();
   *
   * const controller = new AbortController();
   *
   * try {
   * 	await queue.add(({signal}) => {
   * 		const request = got('https://sindresorhus.com');
   *
   * 		signal.addEventListener('abort', () => {
   * 			request.cancel();
   * 		});
   *
   * 		try {
   * 			return await request;
   * 		} catch (error) {
   * 			if (!(error instanceof CancelError)) {
   * 				throw error;
   * 			}
   * 		}
   * 	}, {signal: controller.signal});
   * } catch (error) {
   * 	if (!(error instanceof AbortError)) {
   * 		throw error;
   * 	}
   * }
   * ```
   */
  readonly signal?: AbortSignal;
};
