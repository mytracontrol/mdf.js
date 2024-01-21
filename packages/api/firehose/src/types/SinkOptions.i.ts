/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { LoggerInstance } from '@mdf.js/logger';
import { RetryOptions } from '@mdf.js/utils';
import { WritableOptions } from 'stream';

export interface SinkOptions {
  /** Options for job retry operations */
  retryOptions?: RetryOptions;
  /** Writable streams options */
  writableOptions?: WritableOptions;
  /** Debug logger for development and deep troubleshooting */
  logger?: LoggerInstance;
}
