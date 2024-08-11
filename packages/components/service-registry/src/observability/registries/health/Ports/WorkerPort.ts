/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { LoggerInstance } from '@mdf.js/logger';
import { Aggregator } from '../Aggregator';
import { HealthMessage, HealthMessageType } from '../types';
import { Port } from './Port';

/**
 * WorkerPort class is responsible for managing health diagnostics in a worker process of a
 * clustered Node.js application. It listens for health request messages from the master process,
 * retrieves health checks from the Aggregator, and sends these health diagnostics back to the
 * master.
 *
 * Inherits from the Port class, utilizing its logging capabilities for diagnostic and operational
 * logging within the worker process.
 */
export class WorkerPort extends Port {
  /**
   * Create an instance of health manager in a worker process
   * @param aggregator - Aggregator instance to manage the health checks
   * @param logger - Logger instance for logging activities
   */
  constructor(
    private readonly aggregator: Aggregator,
    logger: LoggerInstance
  ) {
    super(logger);
    // Stryker disable next-line all
    this.logger.debug(`New worker port instance created`);
  }
  /**
   * Responds to health request messages from the master process. This method is triggered
   * by health request messages, gathering the current health checks from the Aggregator
   * and sending a response back to the master process.
   *
   * @param message - The health request message received from the master.
   */
  public readonly onHealthRequestHandler = (message: HealthMessage) => {
    if (message.type === HealthMessageType.REQ && process.send) {
      // Stryker disable next-line all
      this.logger.debug(`Health request on worker [${process.pid}]`);
      process.send({
        type: HealthMessageType.RES,
        requestId: message.requestId,
        checks: this.aggregator.checks,
      });
    }
  };
  /**
   * Starts listening for health diagnostic requests from the master process.
   * This method enables the worker to begin processing incoming health request messages.
   */
  public start(): void {
    // Stryker disable next-line all
    this.logger.debug('Starting health registry request listener in worker process');
    process.on('message', this.onHealthRequestHandler);
  }
  /**
   * Stops listening for health diagnostic requests from the master process.
   * This method disables the worker's ability to process incoming health request messages,
   * effectively isolating it from further health diagnostics communication.
   */
  public stop(): void {
    // Stryker disable next-line all
    this.logger.debug('Stopping health registry request listener in worker process');
    process.off('message', this.onHealthRequestHandler);
  }
}
