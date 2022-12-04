/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Config } from '../provider';
import { CONFIG_ARTIFACT_ID } from './utils';

// *************************************************************************************************
// #region Default values
const CONFIG_SERVICE_SETUP_NAME = CONFIG_ARTIFACT_ID;
const CONFIG_SERVICE_SETUP_PRESET_FILES = 'config/presets/*.preset.json';
const CONFIG_SERVICE_SETUP_SCHEMA_FILES = 'config/schemas/*.schema.json';
const CONFIG_SERVICE_SETUP_CONFIG_FILES = 'config/*.config.json';

export const defaultConfig: Config = {
  name: CONFIG_SERVICE_SETUP_NAME,
  presetFiles: [CONFIG_SERVICE_SETUP_PRESET_FILES],
  schemaFiles: [CONFIG_SERVICE_SETUP_SCHEMA_FILES],
  configFiles: [CONFIG_SERVICE_SETUP_CONFIG_FILES],
};
// #endregion
