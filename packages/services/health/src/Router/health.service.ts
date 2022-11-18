/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health } from '@mdf.js/core';
import { Model } from './health.model';

/** Service class */
export class Service {
  /** Model used by this service */
  readonly #model: Model;
  /**
   * Create an instance of service
   * @param model - model instance
   */
  constructor(model: Model) {
    this.#model = model;
  }
  /** Return the state of all the providers */
  public async health(uuid: string): Promise<Health.API.Health> {
    return this.#model.health(uuid);
  }
}
