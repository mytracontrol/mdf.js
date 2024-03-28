/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

export enum STRATEGY {
  /**
   * When adding a new job to a limiter, if the queue length reaches highWater, drop the oldest job
   * with the lowest priority. This is useful when jobs that have been waiting for too long are not
   * important anymore. If all the queued jobs are more important (based on their priority value)
   * than the one being added, it will not be added.
   */
  LEAK = 'leak',
  /**
   * When adding a new job to a limiter, if the queue length reaches highWater, do not add the new
   * job. This strategy totally ignores priority levels.
   */
  OVERFLOW = 'overflow',
  /**
   * Same as LEAK, except it will only drop jobs that are less important than the one being added.
   * If all the queued jobs are as or more important than the new one, it will not be added.
   */
  OVERFLOW_PRIORITY = 'overflow-priority',
  /**
   * When adding a new job to a limiter, if the queue length reaches highWater, the limiter falls
   * into "blocked mode". All queued jobs are dropped and no new jobs will be accepted until the
   * limiter unblocks. It will unblock after penalty milliseconds have passed without receiving a
   * new job. penalty is equal to 15 * minTime (or 5000 if minTime is 0) by default. This strategy
   * is ideal when bruteforce attacks are to be expected. This strategy totally ignores priority
   * levels.
   */
  BLOCK = 'block',
}

/** Literal types for the strategy property */
export type Strategy =
  | STRATEGY.LEAK
  | STRATEGY.OVERFLOW
  | STRATEGY.OVERFLOW_PRIORITY
  | STRATEGY.BLOCK;

/** Array of all the strategy values */
export const STRATEGIES = Object.values(STRATEGY);
