/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { SettingsManager } from '..';
import { CustomSettings } from '../../types';

/** Model class */
export class Model {
  /**
   * Create an instance of model class
   * @param manager - manager instance
   */
  constructor(private readonly manager: SettingsManager) {}
  /** Return the presets configuration objects */
  public async presets(): Promise<Record<string, CustomSettings>> {
    return {
      ...this.manager.serviceRegisterConfigManager.presets,
      ...this.manager.customRegisterConfigManager.presets,
    };
  }
  /** Return the configuration object */
  public async config(): Promise<CustomSettings> {
    return {
      ...this.manager.serviceRegisterConfigManager.nonDisclosureConfig,
      ...this.manager.customRegisterConfigManager.nonDisclosureConfig,
    };
  }
  /** Return the readme object */
  public async readme(): Promise<string | undefined> {
    return this.manager.readme;
  }
}
