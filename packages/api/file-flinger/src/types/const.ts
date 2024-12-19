/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import type { LimiterOptions } from '@mdf.js/tasks';
import { DEFAULT_ENGINE_OPTIONS } from '../engine';
import { DEFAULT_KEY_GEN_OPTIONS } from '../keygen';
import { DEFAULT_WATCHER_OPTIONS } from '../watcher';
import type { FileFlingerOptions } from './FileFlingerOptions.i';

/** Default limiter options */
export const DEFAULT_LIMITER_OPTIONS: LimiterOptions = {
  concurrency: 1,
  autoStart: true,
  delay: 1000,
  retryOptions: {
    attempts: 3,
    maxWaitTime: 60000,
    timeout: 10000,
    waitTime: 1000,
  },
};

/** Default file flinger options */
export const DEFAULT_FILE_FLINGER_OPTIONS: FileFlingerOptions = {
  ...DEFAULT_KEY_GEN_OPTIONS,
  ...DEFAULT_WATCHER_OPTIONS,
  ...DEFAULT_ENGINE_OPTIONS,
  logger: undefined,
};
