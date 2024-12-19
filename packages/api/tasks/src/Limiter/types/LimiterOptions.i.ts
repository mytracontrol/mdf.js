/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { RetryOptions } from '@mdf.js/utils';
import { QueueOptions } from './QueueOptions.i';

/** Represents the limiter options */
export interface LimiterOptions extends QueueOptions {
  /**
   * The maximum number of concurrent jobs
   * @defaultValue 1
   */
  concurrency?: number;
  /**
   * Delay between each job in milliseconds
   * @defaultValue 0
   * For `concurrency = 1`, the delay is applied after each job is finished
   * For `concurrency > 1`, if the actual number of concurrent jobs is less than `concurrency`, the
   * delay is applied after each job is finished, otherwise, the delay is applied after each job is
   * started.
   */
  delay?: number;
  /**
   * Set the default options for the retry process of the jobs
   * @defaultValue undefined
   */
  retryOptions?: RetryOptions;
  /**
   * Set whether the limiter should start to process the jobs automatically
   * @defaultValue true
   */
  autoStart?: boolean;
}

/** Represents the consolidated limiter options */
export interface ConsolidatedLimiterOptions extends Omit<Required<LimiterOptions>, 'retryOptions'> {
  retryOptions?: RetryOptions;
}

