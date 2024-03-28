/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health } from '@mdf.js/core';
import { Crash, Multi } from '@mdf.js/crash';
import { DebugLogger, LoggerInstance, SetContext } from '@mdf.js/logger';
import EventEmitter from 'events';
import ms from 'ms';
import { Limiter } from '../Limiter';
import { MetaData } from '../Tasks';
import { PollingManager } from './PollingManager';
import { MetricsDefinitions, PollingManagerOptions } from './types';

export declare interface PollingExecutor {
  /** Emitted on every error */
  on(event: 'error', listener: (error: Crash | Multi) => void): this;
  /** Emitted on every state change */
  on(event: 'status', listener: (status: Health.Status) => void): this;
  /** Emitted when a task has ended */
  on(
    event: 'done',
    listener: (uuid: string, result: any, meta: MetaData, error?: Crash | Multi) => void
  ): this;
}

/** Polling manager */
export class PollingExecutor extends EventEmitter {
  /** Debug logger for development and deep troubleshooting */
  private readonly logger: LoggerInstance;
  /** Scan timer */
  private scanTimer: NodeJS.Timeout | undefined;
  /** Polling period in ms */
  private pollingPeriod: number;
  /** Polling manager stats */
  private readonly manager: PollingManager;
  /** Cycle timer */
  private cycleTimer: [number, number] | undefined;
  /**
   * Create a polling manager
   * @param options - Polling manager options
   * @param limiter - Rate limiter
   * @param metrics - Metrics registry
   */
  constructor(
    private readonly options: PollingManagerOptions,
    private readonly limiter: Limiter,
    metrics?: MetricsDefinitions
  ) {
    super();
    // Stryker disable next-line all
    this.logger = SetContext(
      options?.logger ||
        new DebugLogger(
          `mdf:scheduler:polling:${this.options.resource}:${this.options.pollingGroup}`
        ),
      'PollingManager',
      this.options.componentId
    );
    this.manager = new PollingManager(this.options, this.limiter, this.logger);
    this.setMetrics(metrics);
    this.pollingPeriod = ms(this.options.pollingGroup);
  }
  /** Include all the task entries in the limiter */
  private performScan = (): void => {
    this.logger.debug(`Starting polling group ${this.options.pollingGroup}`);
    if (!this.cycleTimer) {
      this.cycleTimer = process.hrtime();
    }
    this.manager.schedule();
  };
  /** Get the next scan time */
  private getNextScan(): number {
    let lastCycleDuration = 0;
    if (this.cycleTimer) {
      const [seconds, nanoseconds] = process.hrtime(this.cycleTimer);
      lastCycleDuration = seconds * 1e3 + nanoseconds / 1e6;
      this.cycleTimer = undefined;
    }
    const nextScan =
      lastCycleDuration < this.pollingPeriod ? this.pollingPeriod - lastCycleDuration : 0;
    return Math.round(nextScan);
  }
  /**
   * Event handler for the end of a cycle event
   * @param check - Health check
   */
  private onEndCycle = (check: Health.Check): void => {
    this.logger.debug(`Polling group ${this.options.pollingGroup} ended`);
    this.logger.debug(
      `Polling group ${this.options.pollingGroup} stats: ${JSON.stringify(check, null, 2)}`
    );
    const nextScan = this.getNextScan();
    this.scanTimer = setTimeout(this.performScan, nextScan);
    this.emit('onEndCycle', check);
  };
  /**
   * Event handler for error events
   * @param error - Error event
   */
  private onError = (error: Crash | Multi): void => {
    if (this.listenerCount('error') > 0) {
      this.emit('error', error);
    }
  };
  /**
   * Event handler for done events
   * @param uuid - Task UUID
   * @param result - Task result
   * @param meta - Task metadata
   * @param error - Task error
   */
  private onDone = (uuid: string, result: any, meta: MetaData, error?: Crash | Multi): void => {
    this.emit('done', uuid, result, meta, error);
  };
  /** Attach the event listeners */
  private attachListeners(): void {
    this.manager.on('error', this.onError);
    this.manager.on('done', this.onDone);
    this.manager.on('endCycle', this.onEndCycle);
  }
  /** Detach the event listeners */
  private detachListeners(): void {
    this.manager.off('error', this.onError);
    this.manager.off('done', this.onDone);
    this.manager.off('endCycle', this.onEndCycle);
  }
  /**
   * Set the metrics definitions for the polling manager
   * @param metrics - Metrics registry
   */
  public setMetrics(metrics?: MetricsDefinitions): void {
    this.manager.setMetrics(metrics);
  }
  /** Start the polling manager */
  public start(): void {
    this.attachListeners();
    this.limiter.start();
    this.performScan();
  }
  /** Stop the polling manager */
  public stop(): void {
    this.detachListeners();
    this.limiter.stop();
    this.limiter.clear();
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
      this.scanTimer = undefined;
    }
  }
  /** Return the stats of the polling manager */
  public get check(): Health.Check {
    return this.manager.check;
  }
}
