/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health } from '@mdf.js/core';
import { LoggerInstance } from '@mdf.js/logger';
import cluster, { Worker } from 'cluster';
import { Aggregator } from '../Aggregator';
import {
  DEFAULT_CONFIG_HEALTH_CLUSTER_UPDATE_INTERVAL,
  HealthMessage,
  HealthMessageType,
  SYSTEM_WORKER,
  SYSTEM_WORKER_HEALTH,
  WORKER_CONNECTION_STATE,
  WORKER_STATUS,
} from '../types';
import { Port } from './Port';

/**
 * The MasterPort class facilitates health monitoring within a master process of a clustered Node.js
 * application.
 * It periodically requests health checks from worker processes and aggregates their responses to
 * maintain an updated view of the application's overall health status.
 *
 * Inherits from the Port class, leveraging shared functionality and adding specific mechanisms for
 * handling health diagnostic requests and responses in a cluster master context.
 */
export class MasterPort extends Port {
  /** Request sequence number */
  private requestId: number = 0;
  /** Timeout interval handler for master polling */
  private timeInterval?: NodeJS.Timeout;
  /**
   * Create an instance of health manager in a master process
   * @param aggregator - Aggregator instance for aggregating health checks from workers.
   * @param logger - Logger instance for logging activities
   * @param interval - interval in milliseconds between each health registry poll from workers.
   */
  constructor(
    private readonly aggregator: Aggregator,
    logger: LoggerInstance,
    private readonly interval: number = DEFAULT_CONFIG_HEALTH_CLUSTER_UPDATE_INTERVAL
  ) {
    super(logger);
    // Stryker disable next-line all
    this.logger.debug(`New master port instance created: ${JSON.stringify({ interval })}`);
  }
  /**
   * Starts the process of periodically polling health registries from worker processes.
   * Ensures that only one polling mechanism is active at any given time.
   */
  public start(): void {
    // Stryker disable next-line all
    this.logger.debug('Starting health registry polling in master process');
    this.aggregator.updateWorkersChecks(this.initializeWorkersChecks());
    if (!this.timeInterval) {
      this.onSendRequest();
      this.timeInterval = setInterval(this.onSendRequest, this.interval);
    }
  }
  /**
   * Stops the polling of health registries from worker processes and clears the polling interval.
   */
  public stop(): void {
    // Stryker disable next-line all
    this.logger.debug('Stopping health registry polling in master process');
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
      this.timeInterval = undefined;
    }
  }
  /**
   * Sends a request to all worker processes to send their current health registries.
   * Handles responses, timeouts, and updates the aggregator with aggregated health checks from
   * workers.
   */
  private readonly onSendRequest = (): void => {
    this.requestId = this.requestId + 1;
    if (!Number.isFinite(this.requestId)) {
      this.requestId = 0;
    }
    let pendingResponses = Object.keys(this.workers).length;
    let timeOutHandler: NodeJS.Timeout | undefined;
    let updatedChecks: Health.Checks = this.initializeWorkersChecks();
    const onWorkerResponse = (worker: Worker, message: HealthMessage) => {
      if (message.requestId !== this.requestId) {
        // Stryker disable next-line all
        this.logger.debug(
          `Health response from worker [${worker.process.pid}] out of the valid period`
        );
        return;
      }
      if (message.type === HealthMessageType.RES) {
        pendingResponses = pendingResponses - 1;
        updatedChecks = this.mergeChecks(updatedChecks, worker, message.checks);
        if (pendingResponses === 0 && timeOutHandler) {
          onFinished();
        }
      }
    };
    const onTimeOut = () => {
      // Stryker disable next-line all
      this.logger.debug(
        `Timeout waiting for health response from workers - ${pendingResponses} pending`
      );
      onFinished();
    };
    const onFinished = () => {
      // Stryker disable next-line all
      this.logger.debug('Health update finished');
      cluster.off('message', onWorkerResponse);
      if (timeOutHandler) {
        clearTimeout(timeOutHandler);
        timeOutHandler = undefined;
      }
      this.aggregator.updateWorkersChecks(updatedChecks);
    };
    timeOutHandler = setTimeout(onTimeOut, this.interval * 0.9);
    cluster.on('message', onWorkerResponse);
    for (const worker of Object.values(this.workers)) {
      if (worker && worker.isConnected()) {
        this.logger.debug(`Sending an health update request to worker [${worker.process.pid}]`);
        worker.send({
          type: HealthMessageType.REQ,
          requestId: this.requestId,
        });
      }
    }
  };
  /**
   * Initializes health checks for all workers, setting up baseline checks for connection status
   * and default health status as 'outdated' until updated by worker responses.
   * @returns Initial checks for all workers.
   */
  private initializeWorkersChecks(): Health.Checks {
    const checks: Health.Checks = { [SYSTEM_WORKER]: [], [SYSTEM_WORKER_HEALTH]: [] };
    for (const worker of Object.values(this.workers)) {
      if (worker) {
        checks[SYSTEM_WORKER].push({
          componentId: `${worker.process.pid}`,
          componentType: 'process',
          status: worker.isConnected() ? Health.STATUS.PASS : Health.STATUS.FAIL,
          observedValue: worker.isConnected()
            ? WORKER_CONNECTION_STATE.CONNECTED
            : WORKER_CONNECTION_STATE.DISCONNECTED,
          observedUnit: 'status',
          workerId: worker.id,
          workerPid: worker.process.pid,
          time: new Date().toISOString(),
        });
        checks[SYSTEM_WORKER_HEALTH].push({
          componentId: `${worker.process.pid}`,
          componentType: 'process',
          status: Health.STATUS.FAIL,
          observedValue: WORKER_STATUS.OUTDATED,
          observedUnit: 'status',
          workerId: worker.id,
          workerPid: worker.process.pid,
          time: new Date().toISOString(),
        });
      }
    }
    return checks;
  }
  /**
   * Merge the checks from a worker, including in them the PID and worker identifier, with passed
   * feed passed as argument
   * @param feed - feed where to merge the checks
   * @param worker - Worker that emit the checks
   * @param checks - Checks to be merged
   * @returns The feed with the merged checks
   */
  private mergeChecks(feed: Health.Checks, worker: Worker, checks: Health.Checks): Health.Checks {
    for (const [key, value] of Object.entries(checks)) {
      const entry = key as Health.CheckEntry;
      const entryChecks = value.map(check => ({
        ...check,
        workerId: worker.id,
        workerPid: worker.process.pid,
      }));
      feed[entry] = feed[entry] ? feed[entry].concat(entryChecks) : entryChecks;
    }
    if (feed[SYSTEM_WORKER_HEALTH]) {
      const result = feed[SYSTEM_WORKER_HEALTH].find(
        workerEntry => workerEntry['workerId'] === worker.id
      );
      if (result) {
        result['observedValue'] = WORKER_STATUS.UPDATED;
        result['status'] = Health.STATUS.PASS;
      }
    }
    return feed;
  }
  /**
   * Retrieves a dictionary of currently active worker processes.
   * @returns A dictionary of Worker instances indexed by their cluster worker ID.
   */
  private get workers(): NodeJS.Dict<Worker> {
    return cluster.workers ? cluster.workers : {};
  }
}
