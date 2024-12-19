/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import type { LoggerInstance } from '@mdf.js/logger';
import type { EngineOptions } from '../engine/types';
import type { KeygenOptions } from '../keygen';
import type { WatcherOptions } from '../watcher';

export interface FileFlingerOptions
  extends KeygenOptions,
    Omit<WatcherOptions, 'name' | 'componentId'>,
    Omit<EngineOptions, 'name' | 'componentId'> {
  /** Logger instance for deep debugging tasks */
  logger?: LoggerInstance;
}
