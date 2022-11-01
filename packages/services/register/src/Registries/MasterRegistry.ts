/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Mytra Control S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Mytra Control S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Mytra Control S.L.
 */

import cluster, { Worker } from 'cluster';
import { CONFIG_REGISTER_CLUSTER_UPDATE_INTERVAL } from '../const';
import { ErrorRecord, RegisterMessage, RegisterMessageType } from '../types';
import { Registry } from './Registry';

export class MasterRegistry extends Registry {
  /** Request sequence number */
  private requestId: number;
  /** Timeout interval handler for master polling */
  private timeInterval?: NodeJS.Timer;
  /** Array of errors registered in the workers */
  private workersErrors: ErrorRecord[] = [];
  /**
   * Create an instance of MasterRegistry
   * @param maxSize - Maximum number of errors to be registered in this registry
   * @param interval - interval to poll the workers
   */
  constructor(
    maxSize?: number,
    private readonly interval: number = CONFIG_REGISTER_CLUSTER_UPDATE_INTERVAL
  ) {
    super(maxSize);
    this.requestId = 0;
  }
  /** Start to polling errors registries from workers */
  public start(): void {
    // Stryker disable next-line all
    this.logger('Starting registry');
    if (!this.timeInterval) {
      this.timeInterval = setInterval(this.onSendRequest.bind(this), this.interval);
      this.onSendRequest();
    }
  }
  /** Stop polling errors registries from workers */
  public stop(): void {
    this.logger('Stopping registry');
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
      this.timeInterval = undefined;
    }
  }
  /** Get all the errors registered, including worker registries */
  public get errors(): ErrorRecord[] {
    return this.workersErrors.concat(this._errors);
  }
  /** Get the number of error registered */
  public get size(): number {
    return this.workersErrors.length + this._errors.length;
  }
  /** Clear all the actual error registries, including worker registries */
  public clear(): void {
    this._errors = [];
    this.workersErrors = [];
    for (const worker of Object.values(this.workers)) {
      if (worker && worker.isConnected()) {
        // Stryker disable next-line all
        this.logger(`Sending an clear register request to worker [${worker.process.pid}]`);
        worker.send({
          type: RegisterMessageType.CLR_REQ,
        });
      }
    }
  }
  /** Handler of errors registry request */
  private onSendRequest = (): void => {
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
        this.logger(`Update response from worker [${worker.process.pid}] out of the valid period`);
        return;
      }
      if (message.type === RegisterMessageType.RES) {
        pendingResponses = pendingResponses - 1;
        updatedRegistries = this.mergeChecks(updatedRegistries, worker, message.errors);
        if (pendingResponses === 0 && timeOutHandler) {
          cluster.off('message', onWorkerResponse);
          clearTimeout(timeOutHandler);
          timeOutHandler = undefined;
          this.workersErrors = updatedRegistries;
        }
      }
    };
    const onTimeOut = () => {
      // Stryker disable next-line all
      this.logger(`Timeout for update response from workers - ${pendingResponses} pending`);
      cluster.off('message', onWorkerResponse);
      this.workersErrors = updatedRegistries;
    };
    timeOutHandler = setTimeout(onTimeOut, this.interval * 0.9);
    cluster.on('message', onWorkerResponse);
    for (const worker of Object.values(this.workers)) {
      if (worker && worker.isConnected()) {
        // Stryker disable next-line all
        this.logger(`Sending an errors register update request to worker [${worker.process.pid}]`);
        worker.send({
          type: RegisterMessageType.REQ,
          requestId: this.requestId,
        });
      }
    }
  };
  /**
   * Merge the errors from a worker, including in them the PID and worker identifier, with feed
   * passed as argument
   * @param feed - feed to be merged with the errors from the worker
   * @param workerErrors - errors from the worker
   * @param worker - Worker that emit the errors
   */
  private mergeChecks(
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
  /** Get the worker associated to this master process */
  private get workers(): NodeJS.Dict<Worker> {
    return cluster.workers ? cluster.workers : {};
  }
}
