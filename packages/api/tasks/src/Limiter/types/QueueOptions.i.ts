/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Strategy } from './Strategy.t';

/** Represents the queue options */
export interface QueueOptions {
  /**
   * The maximum number of jobs in the queue
   * @defaultValue Infinity
   */
  highWater?: number;
  /**
   * The strategy to use when the queue length reaches highWater
   * @defaultValue 'leak'
   */
  strategy?: Strategy;
  /**
   * The penalty for the BLOCK strategy in milliseconds
   * @defaultValue 0
   */
  penalty?: number;
  /**
   * Set the bucket size for the rate limiter
   * @defaultValue 0
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
   * @defaultValue 1
   */
  tokensPerInterval?: number;
  /**
   * Define the interval in milliseconds
   * @defaultValue 1000
   */
  interval?: number;
}

/** Represents the consolidated limiter options */
export interface ConsolidatedQueueOptions extends Required<QueueOptions> {}

