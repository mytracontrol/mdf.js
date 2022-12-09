/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health, Layer } from '@mdf.js/core';
import { DebugLogger, LoggerInstance } from '@mdf.js/logger';
import { prettyMS } from '@mdf.js/utils';
import { merge, pick } from 'lodash';
import { v4 } from 'uuid';

const METADATA_PROPERTIES = [
  'name',
  'description',
  'version',
  'release',
  'instanceId',
  'serviceId',
  'serviceGroupId',
  'tags',
  'links',
];
export abstract class Registry {
  /** Instance unique identifier for trace purposes */
  public readonly componentId: string = v4();
  /** Debugger logger */
  protected readonly logger: LoggerInstance;
  /** Application metadata */
  protected readonly metadata: Layer.App.Metadata;
  /** Base Health Status*/
  protected readonly baseHealth: Omit<Health.AppHealth, 'status' | 'checks'>;
  /**
   * Create an instance of health manager in a master process
   * @param metadata - Service metadata
   */
  constructor(metadata: Layer.App.Metadata) {
    // Stryker disable next-line all
    this.logger = new DebugLogger(`mdf:health`);
    this.metadata = metadata;
    this.baseHealth = {
      ...(pick(metadata, METADATA_PROPERTIES) as Layer.App.Metadata),
      notes: [],
      output: '',
    };
  }
  /**
   * Get the health status of the service
   * @param uuid - Request identifier
   * @returns Health status
   */
  public health(uuid?: string): Health.AppHealth {
    this.logger.debug(`New service status request with uuid [${uuid}]`);
    let checks: Health.Checks = this.checks;
    if (checks[`${this.metadata.name}:uptime`]) {
      checks[`${this.metadata.name}:uptime`].push(...this.uptime[`${this.metadata.name}:uptime`]);
    } else {
      checks = merge(this.checks, this.uptime);
    }
    return { ...this.baseHealth, status: this.status, checks };
  }
  /** Overall component status */
  public get status(): Health.Status {
    let status: Health.Status;
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
  protected abstract checks: Health.Checks;
  /** Return the the uptime of service as a check */
  private get uptime(): Health.Checks {
    return {
      [`${this.metadata.name}:uptime`]: [
        {
          componentId: this.componentId,
          componentType: 'system',
          observedValue: prettyMS(process.uptime() * 1000),
          observedUnit: 'time',
          status: 'pass' as Health.Status,
          time: new Date().toISOString(),
        },
      ],
    };
  }
}
