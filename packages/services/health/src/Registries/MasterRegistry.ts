/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health } from '@mdf.js/core';
import cluster, { Worker } from 'cluster';
import { merge } from 'lodash';
import { Aggregator } from '../Aggregator';
import { CONFIG_HEALTH_CLUSTER_UPDATE_INTERVAL } from '../const';
import { HealthMessage, HealthMessageType, ServiceMetadata } from '../types';
import { Registry } from './Registry';

const SYSTEM_WORKER_HEALTH = 'system:workerHealth';
export class MasterRegistry extends Registry {
  /** Request sequence number */
  private requestId: number;
  /** Timeout interval handler for master polling */
  private timeInterval?: NodeJS.Timer;
  /** Service overall checks */
  private workerChecks: Health.API.Checks = {};
  /**
   * Create an instance of health manager in a master process
   * @param service - service metadata
   * @param aggregator - components aggregator
   * @param interval - interval to poll the workers
   */
  constructor(
    service: ServiceMetadata,
    private readonly aggregator: Aggregator,
    private readonly interval: number = CONFIG_HEALTH_CLUSTER_UPDATE_INTERVAL
  ) {
    super(service);
    this.requestId = 0;
  }
  /** Start to polling health diagnostic from workers */
  public start(): void {
    if (!this.timeInterval) {
      this.timeInterval = setInterval(this.onSendRequest, this.interval);
      this.onSendRequest();
    }
  }
  /** Stop polling health diagnostic from workers*/
  public stop(): void {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
      this.timeInterval = undefined;
    }
  }
  /** Overall service checks */
  protected get checks(): Health.API.Checks {
    return merge(this.aggregator.checks, this.workerChecks);
  }
  /** Handler of health request */
  private readonly onSendRequest = (): void => {
    this.requestId = this.requestId + 1;
    if (!Number.isFinite(this.requestId)) {
      this.requestId = 0;
    }
    let pendingResponses = Object.keys(this.workers).length;
    let timeOutHandler: NodeJS.Timeout | undefined;
    let updatedChecks: Health.API.Checks = this.checkWorkers();
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
          clearTimeout(timeOutHandler);
          cluster.off('message', onWorkerResponse);
          timeOutHandler = undefined;
          this.workerChecks = updatedChecks;
        }
      }
    };
    const onTimeOut = () => {
      // Stryker disable next-line all
      this.logger.debug(
        `Timeout waiting for health response from workers - ${pendingResponses} pending`
      );
      cluster.off('message', onWorkerResponse);
      this.workerChecks = updatedChecks;
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
  /** Check the state of the workers */
  private checkWorkers(): Health.API.Checks {
    const checks: Health.API.Checks = { 'system:workers': [], 'system:workerHealth': [] };
    for (const worker of Object.values(this.workers)) {
      if (worker) {
        checks['system:workers'].push({
          componentId: `${worker.process.pid}`,
          componentType: 'process',
          status: worker.isConnected() ? 'pass' : 'fail',
          observedValue: worker.isConnected() ? 'online' : 'offline',
          observedUnit: 'status',
          workerId: worker.id,
          workerPid: worker.process.pid,
          time: new Date().toISOString(),
        });
        checks[SYSTEM_WORKER_HEALTH].push({
          componentId: `${worker.process.pid}`,
          componentType: 'process',
          status: 'fail',
          observedValue: 'outdated',
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
   * @param checks - Checks to be merged
   * @param worker - Worker that emit the checks
   */
  private mergeChecks(
    feed: Health.API.Checks,
    worker: Worker,
    checks: Health.API.Checks
  ): Health.API.Checks {
    for (const [key, value] of Object.entries(checks)) {
      const entry = key as Health.API.CheckEntry;
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
        result['observedValue'] = 'updated';
        result['status'] = 'pass';
      }
    }
    return feed;
  }
  /** Get the worker associated to this mater process */
  private get workers(): NodeJS.Dict<Worker> {
    return cluster.workers ? cluster.workers : {};
  }
}
