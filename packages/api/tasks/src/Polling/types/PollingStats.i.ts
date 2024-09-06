/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

export interface PollingStats {
  /** Scan time */
  scanTime: Date;
  /** Number of cycles performed */
  cycles: number;
  /** Number of cycles with overruns */
  overruns: number;
  /** Number of consecutive overruns */
  consecutiveOverruns: number;
  /** Average cycle duration in milliseconds */
  averageCycleDuration: number;
  /** Maximum cycle duration in milliseconds */
  maxCycleDuration: number;
  /** Minimum cycle duration in milliseconds */
  minCycleDuration: number;
  /** Last cycle duration in milliseconds */
  lastCycleDuration: number;
  /** Number of tasks included on the fast cycle (normal cycle) */
  inFastCycleTasks: number;
  /** Number of tasks included on the slow cycle */
  inSlowCycleTasks: number;
  /** Number of tasks not included on the cycle */
  inOffCycleTasks: number;
  /** Number of pending tasks */
  pendingTasks: number;
}
