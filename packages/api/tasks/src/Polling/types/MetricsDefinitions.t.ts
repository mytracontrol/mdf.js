/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Metrics } from '@mdf.js/core';

/**
 * Add a prefix to all metrics
 * @param prefix - Prefix to add
 * @param metrics - Metrics to modify
 * @returns Modified metrics
 */
function addPrefix(
  prefix: string,
  metrics: Record<string, Metrics.Config>
): Record<string, Metrics.Config> {
  if (prefix) {
    Object.keys(metrics).forEach(key => {
      metrics[key].name = `${prefix}_${metrics[key].name}`;
    });
  }
  return metrics;
}
/** Metrics for tasks */
const TASK_METRICS_DEFINITIONS = (prefix: string = ''): Record<string, Metrics.Config> => {
  const _metrics: Record<string, Metrics.Config> = {
    task_duration_milliseconds: {
      type: 'Histogram',
      name: `task_duration_milliseconds`,
      help: `Duration in millisecond for each concrete task, providing insights into task efficiency.`,
      labelNames: ['resource', 'taskId'],
      buckets: [
        0.1, 0.5, 1, 2.5, 5, 10, 30, 60, 300, 600, 900, 1800, 3600, 14400, 21600, 43200, 86400,
      ],
    },
    task_total: {
      type: 'Counter',
      name: `task_total`,
      help: `Cumulative count of task performed for tracking demand and usage patterns.`,
      labelNames: ['resource', 'taskId'],
    },
    task_errors_total: {
      type: 'Counter',
      name: `task_errors_total`,
      help: `Cumulative count of task errors, providing insights into system reliability`,
      labelNames: ['resource', 'taskId'],
    },
    task_in_progress: {
      type: 'Gauge',
      name: `task_in_progress`,
      help: `Number of task in progress`,
      labelNames: ['resource', 'taskId'],
    },
  };
  if (prefix) {
    return addPrefix(prefix, _metrics);
  } else {
    return _metrics;
  }
};
/** Metrics for tasks */
type TaskMetricsDefinitions = {
  /** Duration in millisecond for each concrete task, providing insights into task efficiency. */
  task_duration_milliseconds: Metrics.Histogram;
  /** Cumulative count of task performed, for tracking demand and usage patterns. */
  task_total: Metrics.Counter;
  /** Cumulative count of task errors, providing insights into system reliability */
  task_errors_total: Metrics.Counter;
  /** Number of task in progress */
  task_in_progress: Metrics.Gauge;
};

/** Metrics for Scan */
const SCAN_METRICS_DEFINITIONS = (prefix: string = ''): Record<string, Metrics.Config> => {
  const _metrics: Record<string, Metrics.Config> = {
    scan_cycles_total: {
      type: 'Counter',
      name: `scan_cycles_total`,
      help: `Cumulative count of scan cycles performed.`,
      labelNames: ['resource', 'pollingGroup'],
    },
    scan_overruns_total: {
      type: 'Counter',
      name: `scan_overruns_total`,
      help: `Cumulative count of scan overruns`,
      labelNames: ['resource', 'pollingGroup'],
    },
    scan_overruns_consecutive: {
      type: 'Gauge',
      name: `scan_overruns_consecutive`,
      help: `Consecutive count of scan overruns`,
      labelNames: ['resource', 'pollingGroup'],
    },
    scan_task_total: {
      type: 'Gauge',
      name: `scan_task_total`,
      help: `Total number of task included in the scan`,
      labelNames: ['resource', 'pollingGroup'],
    },
    scan_task_off_scan_total: {
      type: 'Gauge',
      name: `scan_task_off_scan_total`,
      help: `Total number of task off scan`,
      labelNames: ['resource', 'pollingGroup'],
    },
    scan_cycle_duration_milliseconds: {
      type: 'Histogram',
      name: `scan_cycle_duration_milliseconds`,
      help: `Duration of scan cycle in milliseconds`,
      labelNames: ['resource', 'pollingGroup'],
      buckets: [
        0.1, 0.5, 1, 2.5, 5, 10, 30, 60, 300, 600, 900, 1800, 3600, 14400, 21600, 43200, 86400,
      ],
    },
    scan_cycles_on_stats: {
      type: 'Gauge',
      name: `scan_cycles_on_stats`,
      help: `Number of cycles used to generate the stats`,
      labelNames: ['resource', 'pollingGroup'],
    },
    scan_duration_avg_milliseconds: {
      type: 'Gauge',
      name: `scan_duration_avg_milliseconds`,
      help: `Average duration of scan cycles in milliseconds`,
      labelNames: ['resource', 'pollingGroup'],
    },
    scan_duration_max_milliseconds: {
      type: 'Gauge',
      name: `scan_duration_max_milliseconds`,
      help: `Maximum duration of scan cycles in milliseconds`,
      labelNames: ['resource', 'pollingGroup'],
    },
    scan_duration_min_milliseconds: {
      type: 'Gauge',
      name: `scan_duration_min_milliseconds`,
      help: `Minimum duration of scan cycles in milliseconds`,
      labelNames: ['resource', 'pollingGroup'],
    },
  };
  if (prefix) {
    return addPrefix(prefix, _metrics);
  } else {
    return _metrics;
  }
};
/** Metrics for Scan */
type ScanMetricsDefinitions = {
  /** Cumulative count of scan cycles performed. */
  scan_cycles_total: Metrics.Counter;
  /** Cumulative count of scan overruns */
  scan_overruns_total: Metrics.Counter;
  /** Consecutive count of scan overruns */
  scan_overruns_consecutive: Metrics.Gauge;
  /** Total number of task included in the scan */
  scan_task_total: Metrics.Gauge;
  /** Total number of task off scan */
  scan_task_off_scan_total: Metrics.Gauge;
  /** Duration of scan cycle in milliseconds */
  scan_cycle_duration_milliseconds: Metrics.Histogram;
  /** Number of cycles used to generate the stats */
  scan_cycles_on_stats: Metrics.Gauge;
  /** Average duration of scan cycles in milliseconds */
  scan_duration_avg_milliseconds: Metrics.Gauge;
  /** Maximum duration of scan cycles in milliseconds */
  scan_duration_max_milliseconds: Metrics.Gauge;
  /** Minimum duration of scan cycles in milliseconds */
  scan_duration_min_milliseconds: Metrics.Gauge;
  /** Maximum number of task in the scan queue */
  scan_queue_size_max_allowed: Metrics.Gauge;
};

/** Metrics definitions */
export const METRICS_DEFINITIONS = (prefix: string = ''): Record<string, Metrics.Config> => {
  return {
    ...TASK_METRICS_DEFINITIONS(prefix),
    ...SCAN_METRICS_DEFINITIONS(prefix),
  };
};
/** Metrics definitions */
export type MetricsDefinitions = TaskMetricsDefinitions & ScanMetricsDefinitions;
