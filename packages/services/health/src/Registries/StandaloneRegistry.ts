/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health } from '@mdf.js/core';
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
