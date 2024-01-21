/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { DebugLogger } from '@mdf.js/logger';
import { ReplyError } from 'redis-errors';
export const CONFIG_PROVIDER_BASE_NAME = 'redis';
export const CONFIG_ARTIFACT_ID =
  process.env['CONFIG_ARTIFACT_ID'] || `mdf-${CONFIG_PROVIDER_BASE_NAME}`;
export const logger = new DebugLogger(`mdf:${CONFIG_PROVIDER_BASE_NAME}:config`);

/**
 * Check error type and select if the reconnection must tried
 * @param error - error to be checked
 * @returns
 */
export const reconnectOnError = (error: ReplyError): boolean => {
  if (error.message.includes('ERR invalid password')) {
    return false;
  }
  return true;
};

/**
 * Function to calculate the retry time
 * @param delayFactor - delay factor used by t
 * @returns
 */
export const retryStrategy = (
  delayFactor?: number,
  maxDelay?: number
): ((times: number) => number | void | null) | undefined => {
  if (delayFactor && maxDelay) {
    return (times: number): number => {
      return Math.min(times * delayFactor, maxDelay);
    };
  } else {
    return;
  }
};
