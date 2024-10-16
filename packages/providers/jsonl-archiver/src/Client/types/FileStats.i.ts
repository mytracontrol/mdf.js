/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';

/** Represents the statistics of a jsonl file */
export interface FileStats {
  /** File handler */
  handler: string;
  /** File name */
  fileName: string;
  /** File path */
  filePath: string;
  /** Flag to indicate if the file is active */
  isActive: boolean;
  /** Flag to indicate if the last operation was an error */
  onError: boolean;
  /** Creation timestamp */
  creationTimestamp: string;
  /** Last modified timestamp */
  lastModifiedTimestamp: string;
  /** Last rotation timestamp */
  lastRotationTimestamp: string;
  /** Current size in bytes */
  currentSize: number;
  /** Number of lines */
  numberLines: number;
  /** Number of append successes in active file */
  appendSuccesses: number;
  /** Number of append errors */
  appendErrors: number;
  /** Number of rotations */
  rotationCount: number;
  /** Last error */
  lastError?: Crash;
}
