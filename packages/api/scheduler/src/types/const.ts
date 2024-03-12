/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { RetryOptions } from '@mdf.js/utils';
import { ConsolidatedLimiterOptions } from './LimiterOptions.i';
import { STRATEGY } from './Strategy.t';

/** Default job type for the limiter */
export const DEFAULT_JOB_TYPE = 'task';
/** Default concurrency for the limiter */
export const DEFAULT_CONCURRENCY = 1;
/** Default delay between each job in milliseconds */
export const DEFAULT_DELAY = 0;
/** Default high water for the rate limiter */
export const DEFAULT_HIGH_WATER = Infinity;
/** Default strategy for the rate limiter */
export const DEFAULT_STRATEGY = STRATEGY.LEAK;
/** Default penalty for the rate limiter */
export const DEFAULT_PENALTY = 0;
/** Default bucket size for the rate limiter */
export const DEFAULT_BUCKET_SIZE = 0;
/** Default tokens per interval for the rate limiter */
export const DEFAULT_TOKENS_PER_INTERVAL = 1;
/** Default interval for the rate limiter */
export const DEFAULT_INTERVAL = 1000;
/** Default priority for the jobs */
export const DEFAULT_PRIORITY = 0;
/** Default weight for the jobs */
export const DEFAULT_WEIGHT = 1;
/** Default autosStart for the limiter */
export const DEFAULT_AUTOSTART = true;
/** Default retry options for the limiter */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  /** Only one attempt */
  attempts: 1,
  /** One second of timeout */
  timeout: 1000,
};

/** Default options for the limiter */
export const DEFAULT_OPTIONS: ConsolidatedLimiterOptions = {
  concurrency: DEFAULT_CONCURRENCY,
  delay: DEFAULT_DELAY,
  highWater: DEFAULT_HIGH_WATER,
  strategy: DEFAULT_STRATEGY,
  penalty: DEFAULT_PENALTY,
  bucketSize: DEFAULT_BUCKET_SIZE,
  tokensPerInterval: DEFAULT_TOKENS_PER_INTERVAL,
  interval: DEFAULT_INTERVAL,
  retryOptions: DEFAULT_RETRY_OPTIONS,
  autoStart: DEFAULT_AUTOSTART,
};
