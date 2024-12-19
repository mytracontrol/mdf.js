/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import type { RetryOptions } from '@mdf.js/utils';
import type { Pusher } from '../../pusher';
import type { ErrorStrategy } from './ErrorStrategy.t.';
import { PostProcessingStrategy } from './PostProcessingStrategy.t';

/** File tasks options */
export interface FileTasksOptions {
  /** Retry options for file operations */
  retryOptions?: RetryOptions;
  /** Pushers to send the files to */
  pushers: Pusher[];
  /** Archive folder for processed files */
  archiveFolder?: string;
  /** Dead-letter folder for files with keying errors */
  deadLetterFolder?: string;
  /** Determine the post-processing strategy for files without errors */
  postProcessingStrategy?: PostProcessingStrategy;
  /** Determine the error strategy for files with errors */
  errorStrategy?: ErrorStrategy;
}
