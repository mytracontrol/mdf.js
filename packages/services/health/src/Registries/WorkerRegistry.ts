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
    process.on('message', this.onHealthRequestHandler.bind(this));
  }
  /** Handler of health request */
  onHealthRequestHandler = (message: HealthMessage) => {
    if (message.type === HealthMessageType.REQ && process.send) {
      // Stryker disable next-line all
      this.logger(`Health request on worker [${process.pid}]`);
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
