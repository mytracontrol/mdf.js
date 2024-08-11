/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Aggregator } from '../Aggregator';
import { Response } from '../types';

/** Model class */
export class Model {
  /**
   * Create an instance of model class
   * @param aggregator - registry instance
   */
  constructor(private readonly aggregator: Aggregator) {}
  /** Return all the actual metrics of this artifact  */
  public async metrics(jsonFormat: boolean): Promise<Response> {
    if (jsonFormat) {
      return this.aggregator.metricsJSON();
    } else {
      return this.aggregator.metricsText();
    }
  }
}
