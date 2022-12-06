/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health, Layer } from '@mdf.js/core';
import { Aggregator } from '../Aggregator';
import { Registry } from './Registry';

export class StandaloneRegistry extends Registry {
  /**
   * Create an instance of health manager in a stand alone process
   * @param metadata - Application metadata
   * @param aggregator - components aggregator
   */
  constructor(metadata: Layer.App.Metadata, private readonly aggregator: Aggregator) {
    super(metadata);
  }
  /** Overall service checks */
  protected get checks(): Health.Checks {
    return this.aggregator.checks;
  }
}
