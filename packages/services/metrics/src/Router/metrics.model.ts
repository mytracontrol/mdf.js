/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Aggregator } from '../Aggregator';
import { MetricsResponse } from '../types';

/** Model class */
export class Model {
  /** Aggregator used by this model */
  readonly #metricsAggregator: Aggregator;
  /**
   * Create an instance of model class
   * @param aggregator - aggregator instance
   */
  constructor(aggregator: Aggregator) {
    this.#metricsAggregator = aggregator;
  }
  /** Return all the actual metrics of this artifact  */
  public async metrics(jsonFormat: boolean): Promise<MetricsResponse> {
    if (jsonFormat) {
      return this.#metricsAggregator.metricsJSON();
    } else {
      return this.#metricsAggregator.metrics();
    }
  }
}
