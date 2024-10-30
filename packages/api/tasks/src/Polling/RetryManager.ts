/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { LoggerInstance } from '@mdf.js/logger';
import { RetryOptions } from '@mdf.js/utils';
import ms from 'ms';
import { DEFAULT_MAX_RETRY_FACTOR, DEFAULT_MAX_TIMEOUT } from '.';
import { WellIdentifiedTaskOptions } from './types';

export class RetryManager {
  /** Limiter delay */
  private readonly limiterDelay: number;
  /** Polling group */
  private readonly pollingGroup: string;
  /** Logger */
  private readonly logger: LoggerInstance;
  /**
   * Create a retry manager
   * @param limiterDelay - Limiter delay
   * @param pollingGroup - Polling group
   * @param logger - Logger
   */
  constructor(limiterDelay: number, pollingGroup: string, logger: LoggerInstance) {
    this.limiterDelay = limiterDelay;
    this.pollingGroup = pollingGroup;
    this.logger = logger;
  }
  /**
   * Fast cycle retry options
   * @param options - Task options
   * @returns Task options with fast cycle retry options
   */
  public fastCycleRetryOptions(options: WellIdentifiedTaskOptions): WellIdentifiedTaskOptions {
    const attempts = Math.min(DEFAULT_MAX_RETRY_FACTOR, options.retryOptions?.attempts ?? 1);
    return this.cycleRetryOptions(options, attempts);
  }
  /**
   * Slow cycle retry options
   * @param options - Task options
   * @returns Task options with slow cycle retry options
   */
  public slowCycleRetryOptions(options: WellIdentifiedTaskOptions): WellIdentifiedTaskOptions {
    return this.cycleRetryOptions(options, 1);
  }
  /**
   * Cycle retry options
   * @param options - Task options
   * @param attempts - Number of attempts
   * @returns Task options with cycle retry options
   */
  private cycleRetryOptions(
    options: WellIdentifiedTaskOptions,
    attempts: number
  ): WellIdentifiedTaskOptions {
    const timeout = Math.min(
      options.retryOptions?.timeout ?? DEFAULT_MAX_TIMEOUT,
      ms(this.pollingGroup) * attempts,
      DEFAULT_MAX_TIMEOUT
    );
    const waitTime = Math.min(
      options.retryOptions?.waitTime ?? this.limiterDelay,
      this.limiterDelay
    );
    const retryOptions: RetryOptions = {
      logger: this.logger.crash,
      attempts,
      timeout,
      waitTime,
      maxWaitTime: waitTime,
      interrupt: options.retryOptions?.interrupt,
      abortSignal: options.retryOptions?.abortSignal,
    };
    return {
      ...options,
      retryOptions,
    };
  }
}
