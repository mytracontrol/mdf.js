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

import { Registry } from '../Registries';
import { ErrorRecord } from '../types';

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
  /** Get all the error in the registry */
  errors(): ErrorRecord[] {
    return this.#registry.errors;
  }
}
