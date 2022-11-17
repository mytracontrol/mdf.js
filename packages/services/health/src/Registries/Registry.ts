/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health } from '@mdf.js/core';
import { DebugLogger, LoggerInstance } from '@mdf.js/logger';
import { merge } from 'lodash';
import { v4 } from 'uuid';
import { ServiceMetadata } from '../types';

export abstract class Registry {
  /** Instance unique identifier for trace purposes */
  public readonly componentId: string = v4();
  /** Debugger logger */
  protected readonly logger: LoggerInstance;
  /** Service metadata */
  protected readonly metadata: ServiceMetadata;
  /** Base Health Status*/
  protected readonly baseHealth: Omit<Health.API.Health, 'status' | 'checks'>;
  /**
   * Create an instance of health manager in a master process
   * @param service - Service metadata
   */
  constructor(service: ServiceMetadata) {
    // Stryker disable next-line all
    this.logger = new DebugLogger(`mdf:health`);
    this.metadata = service;
    this.baseHealth = {
      version: this.metadata.version,
      releaseId: this.metadata.release,
      notes: [],
      output: '',
      serviceId: this.metadata.processId,
      description: this.metadata.description,
      links: this.metadata.links,
    };
  }
  /**
   * Get the health status of the service
   * @param uuid - Request identifier
   * @returns Health status
   */
  public health(uuid?: string): Health.API.Health {
    this.logger.debug(`New service status request with uuid [${uuid}]`);
    let checks: Health.API.Checks = this.checks;
    if (checks[`${this.metadata.name}:uptime`]) {
      checks[`${this.metadata.name}:uptime`].push(...this.uptime[`${this.metadata.name}:uptime`]);
    } else {
      checks = merge(this.checks, this.uptime);
    }
    return { ...this.baseHealth, status: this.status, checks };
  }
  /** Overall component status */
  public get status(): Health.API.Status {
    let status: Health.API.Status;
    if (
      Array.from(Object.values(this.checks)).every(entry =>
        entry.every(check => check.status === 'pass')
      )
    ) {
      status = 'pass';
    } else if (
      Array.from(Object.values(this.checks)).some(entry =>
        entry.some(check => check.status === 'fail')
      )
    ) {
      status = 'fail';
    } else {
      status = 'warn';
    }
    return status;
  }
  /** Overall service checks */
  protected abstract checks: Health.API.Checks;
  /** Return the the uptime of service as a check */
  private get uptime(): Health.API.Checks {
    return {
      [`${this.metadata.name}:uptime`]: [
        {
          componentId: this.componentId,
          componentType: 'system',
          observedValue: process.uptime(),
          observedUnit: 'time',
          status: 'pass' as Health.API.Status,
          time: new Date().toISOString(),
        },
      ],
    };
  }
}
