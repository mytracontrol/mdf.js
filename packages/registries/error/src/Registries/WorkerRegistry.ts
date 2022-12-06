/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { ErrorRecord, RegisterMessage, RegisterMessageType } from '../types';
import { Registry } from './Registry';

export class WorkerRegistry extends Registry {
  /**
   * Create an instance of WorkerRegistry
   * @param maxSize - Maximum number of errors to be registered in this registry
   */
  constructor(maxSize?: number) {
    super(maxSize);
    process.on('message', this.onMasterRequestHandler);
  }
  /** Handler of master requests */
  onMasterRequestHandler = (message: RegisterMessage) => {
    if (message.type === RegisterMessageType.REQ && process.send) {
      // Stryker disable next-line all
      this.logger.debug(`New update request received with requestId [${message.requestId}]`);
      process.send({
        type: RegisterMessageType.RES,
        requestId: message.requestId,
        errors: this._errors,
      });
    }
    if (message.type === RegisterMessageType.CLR_REQ) {
      // Stryker disable next-line all
      this.logger.debug(`New clear request received on worker [${process.pid}] from master`);
      this.clear();
    }
  };
  /** Get all the error in the registry */
  public get errors(): ErrorRecord[] {
    return this._errors;
  }
  /** Get the number of error stored in the registry */
  public get size(): number {
    return this._errors.length;
  }
  /** Clear all the actual error in the registry */
  public clear(): void {
    this._errors = [];
  }
  /** Start to polling errors registries from workers */
  public start(): void {
    // Stryker disable next-line all
    this.logger.debug('Starting registry');
  }
  /** Stop polling errors registries from workers */
  public stop(): void {
    // Stryker disable next-line all
    this.logger.debug('Stopping registry');
  }
}
