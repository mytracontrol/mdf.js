/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Counter, Gauge, Histogram, Registry } from 'prom-client';

/** Metrics for tasks */
type TaskMetricsDefinitions = {
  /** Duration in millisecond for each concrete task, providing insights into task efficiency. */
  task_duration_milliseconds: Histogram;
  /** Cumulative count of task performed, for tracking demand and usage patterns. */
  task_total: Counter;
  /** Cumulative count of task errors, providing insights into system reliability */
  task_errors_total: Counter;
  /** Number of task in progress */
  task_in_progress: Gauge;
};
/** Metrics for tasks */
const TASK_METRICS_DEFINITIONS = (registry: Registry): TaskMetricsDefinitions => {
  const task_duration_milliseconds = new Histogram({
    name: `task_duration_milliseconds`,
    help: `Duration in millisecond for each concrete task, providing insights into task efficiency.`,
    labelNames: ['resource', 'taskId'],
    buckets: [
      0.1, 0.5, 1, 2.5, 5, 10, 30, 60, 300, 600, 900, 1800, 3600, 14400, 21600, 43200, 86400,
    ],
    registers: [registry],
  });
  const task_total = new Counter({
    name: `task_total`,
    help: `Cumulative count of task performed for tracking demand and usage patterns.`,
    labelNames: ['resource', 'taskId'],
    registers: [registry],
  });
  const task_errors_total = new Counter({
    name: `task_errors_total`,
    help: `Cumulative count of task errors, providing insights into system reliability`,
    labelNames: ['resource', 'taskId'],
    registers: [registry],
  });
  const task_in_progress = new Gauge({
    name: `task_in_progress`,
    help: `Number of task in progress`,
    labelNames: ['resource', 'taskId'],
    registers: [registry],
  });

  return {
    task_duration_milliseconds,
    task_total,
    task_errors_total,
    task_in_progress,
  };
};

/** Metrics for Scan */
type ScanMetricsDefinitions = {
  /** Cumulative count of scan cycles performed. */
  scan_cycles_total: Counter;
  /** Cumulative count of scan overruns */
  scan_overruns_total: Counter;
  /** Consecutive count of scan overruns */
  scan_overruns_consecutive: Gauge;
  /** Total number of task included in the scan */
  scan_task_total: Gauge;
  /** Total number of task off scan */
  scan_task_off_scan_total: Gauge;
  /** Duration of scan cycle in milliseconds */
  scan_cycle_duration_milliseconds: Histogram;
  /** Number of cycles used to generate the stats */
  scan_cycles_on_stats: Gauge;
  /** Average duration of scan cycles in milliseconds */
  scan_duration_avg_milliseconds: Gauge;
  /** Maximum duration of scan cycles in milliseconds */
  scan_duration_max_milliseconds: Gauge;
  /** Minimum duration of scan cycles in milliseconds */
  scan_duration_min_milliseconds: Gauge;
  /** Maximum number of task in the scan queue */
  scan_queue_size_max_allowed: Gauge;
};

/** Metrics for Scan */
const SCAN_METRICS_DEFINITIONS = (registry: Registry): ScanMetricsDefinitions => {
  const scan_cycles_total = new Counter({
    name: `scan_cycles_total`,
    help: `Cumulative count of scan cycles performed.`,
    labelNames: ['resource', 'pollingGroup'],
    registers: [registry],
  });
  const scan_overruns_total = new Counter({
    name: `scan_overruns_total`,
    help: `Cumulative count of scan overruns`,
    labelNames: ['resource', 'pollingGroup'],
    registers: [registry],
  });
  const scan_overruns_consecutive = new Gauge({
    name: `scan_overruns_consecutive`,
    help: `Consecutive count of scan overruns`,
    labelNames: ['resource', 'pollingGroup'],
    registers: [registry],
  });
  const scan_task_total = new Gauge({
    name: `scan_task_total`,
    help: `Total number of task included in the scan`,
    labelNames: ['resource', 'pollingGroup'],
    registers: [registry],
  });
  const scan_task_off_scan_total = new Gauge({
    name: `scan_task_off_scan_total`,
    help: `Total number of task off scan`,
    labelNames: ['resource', 'pollingGroup'],
    registers: [registry],
  });
  const scan_cycle_duration_milliseconds = new Histogram({
    name: `scan_cycle_duration_milliseconds`,
    help: `Duration of scan cycle in milliseconds`,
    labelNames: ['resource', 'pollingGroup'],
    buckets: [
      0.1, 0.5, 1, 2.5, 5, 10, 30, 60, 300, 600, 900, 1800, 3600, 14400, 21600, 43200, 86400,
    ],
    registers: [registry],
  });
  const scan_cycles_on_stats = new Gauge({
    name: `scan_cycles_on_stats`,
    help: `Number of cycles used to generate the stats`,
    labelNames: ['resource', 'pollingGroup'],
    registers: [registry],
  });
  const scan_duration_avg_milliseconds = new Gauge({
    name: `scan_duration_avg_milliseconds`,
    help: `Average duration of scan cycles in milliseconds`,
    labelNames: ['resource', 'pollingGroup'],
    registers: [registry],
  });
  const scan_duration_max_milliseconds = new Gauge({
    name: `scan_duration_max_milliseconds`,
    help: `Maximum duration of scan cycles in milliseconds`,
    labelNames: ['resource', 'pollingGroup'],
    registers: [registry],
  });
  const scan_duration_min_milliseconds = new Gauge({
    name: `scan_duration_min_milliseconds`,
    help: `Minimum duration of scan cycles in milliseconds`,
    labelNames: ['resource', 'pollingGroup'],
    registers: [registry],
  });
  const scan_queue_size_max_allowed = new Gauge({
    name: `scan_queue_size_max_allowed`,
    help: `Maximum number of task in the scan queue`,
    labelNames: ['resource', 'pollingGroup'],
    registers: [registry],
  });

  return {
    scan_cycles_total,
    scan_overruns_total,
    scan_overruns_consecutive,
    scan_task_total,
    scan_task_off_scan_total,
    scan_cycle_duration_milliseconds,
    scan_cycles_on_stats,
    scan_duration_avg_milliseconds,
    scan_duration_max_milliseconds,
    scan_duration_min_milliseconds,
    scan_queue_size_max_allowed,
  };
};

/** Metrics definitions */
export type MetricsDefinitions = TaskMetricsDefinitions & ScanMetricsDefinitions;

/** Metrics definitions */
export const METRICS_DEFINITIONS = (registry: Registry): MetricsDefinitions => {
  return {
    ...TASK_METRICS_DEFINITIONS(registry),
    ...SCAN_METRICS_DEFINITIONS(registry),
  };
};
