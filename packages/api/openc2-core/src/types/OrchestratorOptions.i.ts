/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { LoggerInstance } from '@mdf.js/logger';
import { RetryOptions } from '@mdf.js/utils';
import { Registry } from '../modules';

export interface OrchestratorOptions {
  /** Logger instance */
  logger?: LoggerInstance;
  /** Message register */
  register?: Registry;
  /** Register max inactivity time */
  maxInactivityTime?: number;
  /** Maximum number of message to be stored */
  registerLimit?: number;
  /** Options for adapter retry operations */
  retryOptions?: RetryOptions;
  /** Aging time in milliseconds for registered instances */
  agingTime?: number;
}
