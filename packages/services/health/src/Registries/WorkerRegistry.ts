/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health } from '@mdf.js/core';
import { Aggregator } from '../Aggregator';
import { HealthMessage, HealthMessageType, ServiceMetadata } from '../types';
import { Registry } from './Registry';

export class WorkerRegistry extends Registry {
  /**
   * Create an instance of health manager in a worker process
   * @param service - Service metadata
   * @param aggregator - components aggregator
   */
  constructor(service: ServiceMetadata, private readonly aggregator: Aggregator) {
    super(service);
    process.on('message', this.onHealthRequestHandler);
  }
  /** Handler of health request */
  onHealthRequestHandler = (message: HealthMessage) => {
    if (message.type === HealthMessageType.REQ && process.send) {
      // Stryker disable next-line all
      this.logger.debug(`Health request on worker [${process.pid}]`);
      process.send({
        type: HealthMessageType.RES,
        requestId: message.requestId,
        checks: this.health().checks,
      });
    }
  };
  /** Overall service checks */
  protected get checks(): Health.API.Checks {
    return this.aggregator.checks;
  }
}
