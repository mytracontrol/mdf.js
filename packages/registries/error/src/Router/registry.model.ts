/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Registry } from '../Registries';
import { ErrorRecord } from '../types';

/** Model class */
export class Model {
  /** Registry used by this model */
  private readonly registry: Registry;
  /**
   * Create an instance of model class
   * @param registry - registry instance
   */
  constructor(registry: Registry) {
    this.registry = registry;
  }
  /** Get all the error in the registry */
  errors(): ErrorRecord[] {
    return this.registry.errors;
  }
}
