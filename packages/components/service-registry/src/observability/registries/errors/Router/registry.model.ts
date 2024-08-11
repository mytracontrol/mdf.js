/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Aggregator } from '../Aggregator';
import { ErrorRecord } from '../types';

/** Model class */
export class Model {
  /**
   * Create an instance of model class
   * @param aggregator - registry instance
   */
  constructor(private readonly aggregator: Aggregator) {}
  /** Get all the error in the registry */
  errors(): ErrorRecord[] {
    return this.aggregator.errors;
  }
}
