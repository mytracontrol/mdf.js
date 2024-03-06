/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { RetryOptions } from '@mdf.js/utils';
import { Strategy } from './Strategy.t';

export interface LimiterOptions {
  /**
   * The maximum number of concurrent jobs
   * @default 1
   */
  concurrency?: number;
  /**
   * Delay between each job in milliseconds
   * @default 0
   * For `concurrency = 1`, the delay is applied after each job is finished
   * For `concurrency > 1`, if the actual number of concurrent jobs is less than `concurrency`, the
   * delay is applied after each job is finished, otherwise, the delay is applied after each job is
   * started.
   */
  delay?: number;
  /**
   * The maximum number of jobs in the queue
   * @default Infinity
   */
  highWater?: number;
  /**
   * The strategy to use when the queue length reaches highWater
   * @default 'leak'
   */
  strategy?: Strategy;
  /**
   * The penalty for the BLOCK strategy in milliseconds
   * @default 0
   */
  penalty?: number;
  /**
   * Set the bucket size for the rate limiter
   * @default 0
   * If the bucket size is 0, only `concurrency` and `delay` will be used to limit the rate of the
   * jobs. If the bucket size is greater than 0, the consumption of the tokens will be used to
   * limit the rate of the jobs. The bucket size is the maximum number of tokens that can be
   * consumed in the interval. The interval is defined by the `tokensPerInterval` and `interval`
   * properties.
   * @see https://en.wikipedia.org/wiki/Token_bucket
   */
  bucketSize?: number;
  /**
   * Define the number of tokens that will be added to the bucket at the beginning of the interval
   * @default 1
   */
  tokensPerInterval?: number;
  /**
   * Define the interval in milliseconds
   * @default 1000
   */
  interval?: number;
  /**
   * Set the default options for the retry process of the jobs
   * @default undefined
   */
  retryOptions?: RetryOptions;
}

/** Represents the consolidated limiter options */
export interface ConsolidatedLimiterOptions extends Omit<Required<LimiterOptions>, 'retryOptions'> {
  retryOptions?: RetryOptions;
}
