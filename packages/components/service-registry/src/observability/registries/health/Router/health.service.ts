/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Layer } from '@mdf.js/core';
import { Model } from './health.model';

/** Service class */
export class Service {
  /**
   * Create an instance of service
   * @param model - model instance
   */
  constructor(private readonly model: Model) {}
  /** Return the state of all the providers */
  public async health(): Promise<Layer.App.Health> {
    return this.model.health();
  }
}
