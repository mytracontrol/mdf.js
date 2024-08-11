/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Response } from '../types';
import { Model } from './metrics.model';

/** Service class */
export class Service {
  /**
   * Create an instance of service
   * @param model - model instance
   */
  constructor(private readonly model: Model) {}
  /** Return all the actual metrics of this artifact */
  public metrics(jsonFormat: boolean): Promise<Response> {
    return this.model.metrics(jsonFormat);
  }
}
