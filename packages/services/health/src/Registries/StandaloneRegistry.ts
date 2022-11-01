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
import { Aggregator } from '../Aggregator';
import { ServiceMetadata } from '../types';
import { Registry } from './Registry';

export class StandaloneRegistry extends Registry {
  /**
   * Create an instance of health manager in a stand alone process
   * @param service - Microservice metadata
   * @param aggregator - components aggregator
   */
  constructor(service: ServiceMetadata, private readonly aggregator: Aggregator) {
    super(service);
  }
  /** Overall service checks */
  protected get checks(): Health.API.Checks {
    return this.aggregator.checks;
  }
}
