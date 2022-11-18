/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health } from '@mdf.js/core';
import { Registry } from '../Registries';

/** Model class */
export class Model {
  /** Registry used by this model */
  readonly #registry: Registry;
  /**
   * Create an instance of model class
   * @param registry - registry instance
   */
  constructor(registry: Registry) {
    this.#registry = registry;
  }
  /** Return the state of all the providers */
  public health(uuid: string): Promise<Health.API.Health> {
    return Promise.resolve(this.#registry.health(uuid));
  }
}
