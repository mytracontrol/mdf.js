/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';

export interface AppendResult {
  /** Indicates if the operation was completed successfully */
  success: boolean;
  /** Number of records appended */
  appended: number;
  /** Number of records that were skipped */
  skipped: number;
  /** Number of records that triggered an error */
  errors: number;
  /** Records that were skipped */
  skippedRecords: Record<string, unknown>[];
  /** Records that triggered an error */
  errorRecords: { record: Record<string, unknown>; error: Crash }[];
}
