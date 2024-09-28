/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { PollingStats } from './PollingStats.i';

/** Maximum number of scan overruns before considering the scan is in a bad state */
export const DEFAULT_MAX_CONSECUTIVE_SCAN_OVERRUNS = 3;
/** Default scan cycles on stats */
export const DEFAULT_SCAN_CYCLES_ON_STATS = 10;
/** Default slow cycle ratio */
export const DEFAULT_SLOW_CYCLE_RATIO = 3;

/** Default maximum retries for a task */
export const DEFAULT_MAX_RETRY_FACTOR = 3;
/** Default maximum timeout for a task */
export const DEFAULT_MAX_TIMEOUT = 15000;

/** Default polling manager stats */
export const DEFAULT_POLLING_STATS: PollingStats = {
  scanTime: new Date(),
  cycles: 0,
  overruns: 0,
  consecutiveOverruns: 0,
  averageCycleDuration: 0,
  maxCycleDuration: 0,
  minCycleDuration: Infinity,
  lastCycleDuration: 0,
  inFastCycleTasks: 0,
  inSlowCycleTasks: 0,
  inOffCycleTasks: 0,
  pendingTasks: 0,
};
