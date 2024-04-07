/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Layer } from '@mdf.js/core';
import { Aggregator } from '../Aggregator';

/** Model class */
export class Model {
  /**
   * Create an instance of model class
   * @param aggregator - registry instance
   */
  constructor(private readonly aggregator: Aggregator) {}
  /** Return the state of all the providers */
  public health(): Promise<Layer.App.Health> {
    return Promise.resolve(this.aggregator.health);
  }
}
