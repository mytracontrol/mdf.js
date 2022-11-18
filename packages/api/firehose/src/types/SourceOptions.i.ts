/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { LoggerInstance } from '@mdf.js/logger';
import { RetryOptions } from '@mdf.js/utils';
import { ReadableOptions } from 'stream';
import { PostConsumeOptions } from './PostConsumeOptions.i';

export interface SourceOptions {
  /** Options for job retry operations */
  retryOptions?: RetryOptions;
  /** Readable streams options */
  readableOptions?: ReadableOptions;
  /**
   * Indicates the quality of service for the job, indeed this indicate the number of sinks that
   * must be successfully processed to consider the job as successfully processed
   */
  qos?: number;
  /** Post consume operations options */
  postConsumeOptions?: PostConsumeOptions;
  /** Debug logger for development and deep troubleshooting */
  logger?: LoggerInstance;
}
