/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { ConfigManager } from '../ConfigManager';

/** Model class */
export class Model {
  /**
   * Create an instance of model class
   * @param manager - manager instance
   */
  constructor(private readonly manager: ConfigManager) {}
  /** Return the presets configuration objects */
  public async presets(): Promise<Record<string, Record<string, any>>> {
    return this.manager.presets;
  }
  /** Return the configuration object */
  public async config(): Promise<Record<string, any>> {
    return this.manager.config;
  }
}
