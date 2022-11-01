/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Mytra Control S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Mytra Control S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Mytra Control S.L.
 */

import { LoggerInstance } from '@mdf.js/logger';
import { RetryOptions } from '@mdf.js/utils';
import { Registry } from '../modules';

export interface ComponentOptions {
  /** Instance identification */
  id: string;
  /** Logger instance */
  logger?: LoggerInstance;
  /** Message and jobs registry */
  registry?: Registry;
  /** Register max inactivity time */
  maxInactivityTime?: number;
  /** Maximum number of message to be stored */
  registerLimit?: number;
  /** Options for adapter retry operations */
  retryOptions?: RetryOptions;
}
