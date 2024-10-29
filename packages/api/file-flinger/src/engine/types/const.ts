/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import type { LimiterOptions } from '@mdf.js/tasks';
import { v4 } from 'uuid';
import type { EngineOptions } from './EngineOptions.i';
import { ErrorStrategy } from './ErrorStrategy.t.';
import type { FileTasksOptions } from './FileTasksOptions.i';
import { PostProcessingStrategy } from './PostProcessingStrategy.t';

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

/** Default file tasks options */
export const DEFAULT_FILE_TASKS_OPTIONS: FileTasksOptions = {
  retryOptions: DEFAULT_LIMITER_OPTIONS.retryOptions,
  pushers: [],
  archiveFolder: undefined,
  deadLetterFolder: undefined,
  postProcessingStrategy: PostProcessingStrategy.DELETE,
  errorStrategy: ErrorStrategy.IGNORE,
};

/** Default engine options */
export const DEFAULT_ENGINE_OPTIONS: EngineOptions = {
  name: 'engine',
  componentId: v4(),
  failedOperationDelay: 30000,
  ...DEFAULT_FILE_TASKS_OPTIONS,
};
