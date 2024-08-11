/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { LoggerInstance } from '@mdf.js/logger';
import { Aggregator } from '../Aggregator';
import { RegisterMessage, RegisterMessageType } from '../types';
import { Port } from './Port';

/**
 * WorkerPort class is designed to manage error reporting in a worker process, specifically
 * within a Node.js cluster. It listens for messages from the master process to either send
 * back the current error registry or to clear its error records upon request.
 *
 * Inherits from the Port class, leveraging its logging functionality to provide insight
 * into the inter-process communication and error management actions taking place within
 * the worker process.
 */
export class WorkerPort extends Port {
  /**
   * Create an instance of errors manager in a worker process
   * @param aggregator - Aggregator instance to manage the errors
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
   * Handles requests from the master process, responding with the current error registry or
   * clearing errors.
   * @param message - The message received from the master process, containing the request type and
   * optionally a request ID.
   */
  onMasterRequestHandler = (message: RegisterMessage) => {
    if (message.type === RegisterMessageType.REQ && process.send) {
      // Stryker disable next-line all
      this.logger.debug(`New update request received with requestId [${message.requestId}]`);
      process.send({
        type: RegisterMessageType.RES,
        requestId: message.requestId,
        errors: this.aggregator.errors,
      });
    } else if (message.type === RegisterMessageType.CLR_REQ) {
      // Stryker disable next-line all
      this.logger.debug(`New clear request received on worker [${process.pid}] from master`);
      this.clear();
    }
  };
  /** Clear all the actual error in the registry */
  public clear(): void {
    // Stryker disable next-line all
    this.logger.debug('Clearing errors registry in worker process');
    this.aggregator.clear();
  }
  /**
   * Starts listening for messages from the master process, enabling response to error registry
   * requests and clear commands.
   */
  public start(): void {
    // Stryker disable next-line all
    this.logger.debug('Starting error registry request listener in worker process');
    process.on('message', this.onMasterRequestHandler);
  }
  /**
   * Stops listening for messages from the master process, effectively disabling further
   * communication for error registry management.
   */
  public stop(): void {
    // Stryker disable next-line all
    this.logger.debug('Stopping error registry request listener in worker process');
    process.off('message', this.onMasterRequestHandler);
  }
}
