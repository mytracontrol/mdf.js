/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { CustomSetting, CustomSettings } from '../../types';
import { Model } from './config.model';

/** Service class */
export class Service {
  /**
   * Create an instance of service
   * @param model - model instance
   */
  constructor(private readonly model: Model) {}
  /** Return the presets configuration objects */
  public async presets(): Promise<Record<string, CustomSettings>> {
    return this.model.presets();
  }
  /** Return the configuration object */
  public async config(): Promise<Record<string, CustomSetting>> {
    return this.model.config();
  }
  /** Return the readme object */
  public async readme(): Promise<string | undefined> {
    return this.model.readme();
  }
}
