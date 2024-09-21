/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { LoggerInstance } from '@mdf.js/logger';
import { TransformOptions } from 'stream';
import { OpenStrategy } from './OpenJobs.t';

export interface EngineOptions {
  /** Strategies to be applied over the jobs */
  strategies?: {
    [type: string]: OpenStrategy[];
  };
  /** Transform streams options */
  transformOptions?: TransformOptions;
  /** Debug logger for development and deep troubleshooting */
  logger?: LoggerInstance;
  /** Maximum time of inactivity before the firehose notify that is hold */
  maxInactivityTime?: number;
}
