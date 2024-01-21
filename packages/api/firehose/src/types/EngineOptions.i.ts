/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Jobs } from '@mdf.js/core';
import { LoggerInstance } from '@mdf.js/logger';
import { TransformOptions } from 'stream';

export interface EngineOptions<
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, any> = Record<string, any>,
> {
  /** Strategies to be applied over the jobs */
  strategies?: {
    [type: string]: Jobs.Strategy<Type, Data, CustomHeaders>[];
  };
  /** Transform streams options */
  transformOptions?: TransformOptions;
  /** Debug logger for development and deep troubleshooting */
  logger?: LoggerInstance;
}
