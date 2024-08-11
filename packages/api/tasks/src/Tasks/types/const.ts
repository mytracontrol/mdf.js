/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { RetryOptions } from '@mdf.js/utils';
import { RETRY_STRATEGY } from './RetryStrategy.t';

/** Default priority for the jobs */
export const DEFAULT_PRIORITY = 0;
/** Default weight for the jobs */
export const DEFAULT_WEIGHT = 1;
/** Default retry options for the limiter */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  /** Only one attempt */
  attempts: 1,
  /** One second of timeout */
  timeout: 1000,
};
/** Default retry strategy */
export const DEFAULT_RETRY_STRATEGY = RETRY_STRATEGY.RETRY;
