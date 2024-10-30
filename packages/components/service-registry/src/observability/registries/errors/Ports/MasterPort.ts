/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { LoggerInstance } from '@mdf.js/logger';
import cluster, { Worker } from 'cluster';
import { Aggregator } from '../Aggregator';
import {
  DEFAULT_CONFIG_REGISTER_CLUSTER_UPDATE_INTERVAL,
  ErrorRecord,
  RegisterMessage,
  RegisterMessageType,
} from '../types';
import { Port } from './Port';

/**
 * MasterPort class manages the collection and aggregation of error records from worker processes
 * in a clustered environment. It periodically requests error registries from each worker,
 * aggregates the errors, and updates the main aggregator instance with the collected errors.
 *
 * Inherits from the Port class, utilizing its logging capabilities and defining additional
 * mechanisms for inter-process communication and error aggregation specific to the master process.
 */
export class MasterPort extends Port {
  /** Request sequence number */
  private requestId: number = 0;
  /** Timeout interval handler for master polling */
  private timeInterval?: NodeJS.Timeout;
  /**
   * Create an instance of errors manager in a master process
   * @param aggregator - Aggregator instance to manage the errors
   * @param logger - Logger instance for logging activities
   * @param interval - interval in milliseconds between each error registry poll from workers.
   */
  constructor(
    private readonly aggregator: Aggregator,
    logger: LoggerInstance,
    private readonly interval: number = DEFAULT_CONFIG_REGISTER_CLUSTER_UPDATE_INTERVAL
  ) {
    super(logger);
    // Stryker disable next-line all
    this.logger.debug(`New master port instance created: ${JSON.stringify({ interval })}`);
  }
  /**
   * Starts the process of periodically polling error registries from worker processes.
   * Ensures that only one polling mechanism is active at any given time.
   */
  public start(): void {
    // Stryker disable next-line all
    this.logger.debug('Starting errors registry polling in master process');
    if (!this.timeInterval) {
      this.onSendRequest();
      this.timeInterval = setInterval(this.onSendRequest, this.interval);
    }
  }
  /**
   * Stops the polling of error registries from worker processes and clears the polling interval.
   */
  public stop(): void {
    // Stryker disable next-line all
    this.logger.debug('Stopping errors registry polling in master process');
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
      this.timeInterval = undefined;
    }
  }
  /**
   * Clears all error registries, both in the master and in all connected worker processes.
   */
  public clear(): void {
    for (const worker of Object.values(this.workers)) {
      if (worker?.isConnected()) {
        // Stryker disable next-line all
        this.logger.debug(`Sending an clear register request to worker [${worker.process.pid}]`);
        worker.send({
          type: RegisterMessageType.CLR_REQ,
        });
      }
    }
    this.aggregator.clear();
  }
  /**
   * Sends a request to all worker processes to send their current error registries.
   * Handles responses, timeouts, and updates the aggregator with aggregated errors from workers.
   */
  private readonly onSendRequest = (): void => {
    this.requestId = this.requestId + 1;
    if (!Number.isFinite(this.requestId)) {
      this.requestId = 0;
    }
    let pendingResponses = Object.keys(this.workers).length;
    let timeOutHandler: NodeJS.Timeout | undefined;
    let updatedRegistries: ErrorRecord[] = [];
    const onWorkerResponse = (worker: Worker, message: RegisterMessage) => {
      if (message.requestId !== this.requestId) {
        // Stryker disable next-line all
        this.logger.debug(
          `Update response from worker [${worker.process.pid}] out of the valid period`
        );
        return;
      }
      if (message.type === RegisterMessageType.RES) {
        pendingResponses = pendingResponses - 1;
        updatedRegistries = this.mergeErrors(updatedRegistries, worker, message.errors);
        if (pendingResponses === 0 && timeOutHandler) {
          onFinished();
        }
      }
    };
    const onTimeOut = () => {
      // Stryker disable next-line all
      this.logger.debug(`Timeout for update response from workers - ${pendingResponses} pending`);
      onFinished();
    };
    const onFinished = () => {
      // Stryker disable next-line all
      this.logger.debug('Registry update from workers finished');
      cluster.off('message', onWorkerResponse);
      if (timeOutHandler) {
        clearTimeout(timeOutHandler);
        timeOutHandler = undefined;
      }
      this.aggregator.updateWorkersErrors(updatedRegistries);
    };
    timeOutHandler = setTimeout(onTimeOut, this.interval * 0.9);
    cluster.on('message', onWorkerResponse);
    for (const worker of Object.values(this.workers)) {
      if (worker?.isConnected()) {
        // Stryker disable next-line all
        this.logger.debug(
          `Sending an errors register update request to worker [${worker.process.pid}]`
        );
        worker.send({
          type: RegisterMessageType.REQ,
          requestId: this.requestId,
        });
      }
    }
  };
  /**
   * Merges the errors received from a worker process into the accumulated error records.
   * Adds worker identification details to each error record for traceability.
   * @param feed - feed to be merged with the errors from the worker
   * @param worker - Worker that emit the errors
   * @param workerErrors - errors from the worker
   */
  private mergeErrors(
    feed: ErrorRecord[],
    worker: Worker,
    workerErrors: ErrorRecord[]
  ): ErrorRecord[] {
    return feed.concat(
      workerErrors.map(error => {
        return {
          ...error,
          workerPid: worker.process.pid,
          workerId: worker.id,
        };
      })
    );
  }
  /**
   * Retrieves a dictionary of currently active worker processes.
   * @returns A dictionary of Worker instances indexed by their cluster worker ID.
   */
  private get workers(): NodeJS.Dict<Worker> {
    return cluster.workers ? cluster.workers : {};
  }
}
