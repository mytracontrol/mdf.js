/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health } from '@mdf.js/core';
import { Crash, Multi } from '@mdf.js/crash';
import ms from 'ms';
import {
  DEFAULT_MAX_CONSECUTIVE_SCAN_OVERRUNS,
  DEFAULT_POLLING_STATS,
  DEFAULT_SCAN_CYCLES_ON_STATS,
  MetricsDefinitions,
  PollingGroup,
  PollingStats,
} from './types';

export class PollingMetricsHandler {
  /** Polling stats */
  private pollingStats: PollingStats = { ...DEFAULT_POLLING_STATS };
  /** Scan cycles duration in milliseconds */
  private readonly scanCyclesDuration: number[] = [];
  /** Metrics labels */
  private readonly statsLabels: { resource: string; pollingGroup: string };
  /** Cycle timer */
  private cycleTimer: [number, number] | undefined;
  /**
   * Create a polling stats manager
   * @param componentId - Component identifier
   * @param resource - Resource identifier
   * @param pollingGroup - Polling group assigned to this manager
   * @param cyclesOnStats - Number of cycles on stats
   * @param logger - Logger instance
   * @param metrics - Metrics instances
   */
  constructor(
    private readonly componentId: string,
    private readonly resource: string,
    private readonly pollingGroup: PollingGroup,
    private readonly cyclesOnStats = DEFAULT_SCAN_CYCLES_ON_STATS,
    private readonly metrics: MetricsDefinitions
  ) {
    this.statsLabels = { resource: this.resource, pollingGroup: this.pollingGroup };
    this.metrics.scan_cycles_on_stats.set(this.statsLabels, this.cyclesOnStats);
  }
  /** Set the initial point of a cycle */
  public initializeCycle(): void {
    if (!this.cycleTimer) {
      this.cycleTimer = process.hrtime();
      this.pollingStats.scanTime = new Date();
    }
  }
  /** Set the final point of a cycle */
  public finalizeCycle(): void {
    this.checkOverruns(this.duration);
    this.checkDurationStats(this.duration);
  }
  /**
   * Get the duration of a cycle
   * @returns Duration of a cycle
   */
  private get duration(): number {
    if (this.cycleTimer) {
      const [seconds, nanoseconds] = process.hrtime(this.cycleTimer);
      this.pollingStats.lastCycleDuration = seconds * 1e3 + nanoseconds / 1e6;
      this.cycleTimer = undefined;
      this.metrics.scan_cycle_duration_milliseconds.observe(
        this.statsLabels,
        this.pollingStats.lastCycleDuration
      );
    }
    return this.pollingStats.lastCycleDuration;
  }
  /**
   * Check if the cycle has overruns and update the metrics
   * @param duration - Duration of the cycle
   */
  private checkOverruns(duration: number): void {
    this.metrics.scan_cycles_total.inc(this.statsLabels);
    this.pollingStats.cycles++;
    if (duration > ms(this.pollingGroup)) {
      this.pollingStats.overruns++;
      this.pollingStats.consecutiveOverruns++;
      this.metrics.scan_overruns_total.inc(this.statsLabels);
      this.metrics.scan_overruns_consecutive.inc(this.statsLabels);
    } else {
      this.pollingStats.consecutiveOverruns = 0;
      this.metrics.scan_overruns_consecutive.set(this.statsLabels, 0);
    }
  }
  /**
   * Check the duration stats of a cycle
   * @param duration - Duration of the cycle
   */
  private checkDurationStats(duration: number): void {
    this.scanCyclesDuration.push(duration);
    if (this.scanCyclesDuration.length > this.cyclesOnStats) {
      this.scanCyclesDuration.shift();
    }
    if (duration > this.pollingStats.maxCycleDuration) {
      this.pollingStats.maxCycleDuration = duration;
      this.metrics.scan_duration_max_milliseconds.set(this.statsLabels, duration);
    }
    if (duration < this.pollingStats.minCycleDuration) {
      this.pollingStats.minCycleDuration = duration;
      this.metrics.scan_duration_min_milliseconds.set(this.statsLabels, duration);
    }
    this.pollingStats.averageCycleDuration =
      this.scanCyclesDuration.reduce((acc, val) => acc + val, 0) / this.scanCyclesDuration.length;
    this.metrics.scan_duration_avg_milliseconds.set(
      this.statsLabels,
      this.pollingStats.averageCycleDuration
    );
  }
  /**
   * Add a task to the in progress stats
   * @param taskId - Task identifier
   */
  public addTaskInProgress(taskId: string): void {
    this.metrics.task_in_progress.inc({ resource: this.resource, taskId });
  }
  /**
   * Remove a task from the in progress stats
   * @param taskId - Task identifier
   * @param duration - Task duration
   * @param error - Task error
   */
  public removeTaskInProgress(taskId: string, duration: number = 0, error?: Crash | Multi): void {
    const labels = { resource: this.resource, taskId };
    this.metrics.task_in_progress.dec(labels);
    this.metrics.task_total.inc(labels);
    if (error) {
      this.metrics.task_errors_total.inc(labels);
    }
    this.metrics.task_duration_milliseconds.observe(labels, duration);
  }
  /** Get health check of the component */
  public get check(): Health.Check {
    const overrunsStatus =
      this.pollingStats.consecutiveOverruns < DEFAULT_MAX_CONSECUTIVE_SCAN_OVERRUNS
        ? Health.STATUS.PASS
        : Health.STATUS.WARN;
    const _check: Health.Check = {
      componentId: this.componentId,
      pollingGroup: this.pollingGroup,
      componentType: 'pollingGroup',
      observedValue: this.pollingStats,
      observedUnit: 'polling stats',
      status: overrunsStatus,
      time: this.pollingStats.scanTime.toISOString(),
    };
    return _check;
  }
}
