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

import { Health } from '@mdf/core';
import Debug, { Debugger } from 'debug';
import { merge } from 'lodash';
import { v4 } from 'uuid';
import { ServiceMetadata } from '../types';

export abstract class Registry {
  /** Instance unique identifier for trace purposes */
  public readonly componentId: string = v4();
  /** Debugger logger */
  protected readonly logger: Debugger;
  /** Service metadata */
  protected readonly metadata: ServiceMetadata;
  /** Base Health Status*/
  protected readonly baseHealth: Omit<Health.API.Health, 'status' | 'checks'>;
  /**
   * Create an instance of health manager in a master process
   * @param service - Service metadata
   */
  constructor(service: ServiceMetadata) {
    this.logger = Debug(`${service.name}:health`);
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
    this.logger(`New service status request with uuid [${uuid}]`);
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
