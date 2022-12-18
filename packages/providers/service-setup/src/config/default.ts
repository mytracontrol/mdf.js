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
const CONFIG_SERVICE_SETUP_CONFIG_FILES = `${process.cwd()}/config/*.*`;
const CONFIG_SERVICE_SETUP_PRESET_FILES = `${process.cwd()}/config/presets/*.*`;
const CONFIG_SERVICE_SETUP_SCHEMA_FILES = `${process.cwd()}/config/schemas/*.*`;

export const defaultConfig: Config = {
  name: CONFIG_SERVICE_SETUP_NAME,
  presetFiles: [CONFIG_SERVICE_SETUP_PRESET_FILES],
  schemaFiles: [CONFIG_SERVICE_SETUP_SCHEMA_FILES],
  configFiles: [CONFIG_SERVICE_SETUP_CONFIG_FILES],
};
// #endregion
