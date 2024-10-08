/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Represents the statistics of a jsonl file */
export interface JsonlFileStatistics {
  numberOfAppendSuccesses: number;
  numberOfAppendErrors: number;
  lastAppendSuccessTimestamp: string;
  lastAppendErrorTimestamp: string;
}
