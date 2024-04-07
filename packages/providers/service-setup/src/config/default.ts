/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Config } from '../provider';

// *************************************************************************************************
// #region Default values
const SERVICE_SETUP_CONFIG_FILES = `${process.cwd()}/config/*.*`;
const SERVICE_SETUP_PRESET_FILES = `${process.cwd()}/config/presets/*.*`;
const SERVICE_SETUP_SCHEMA_FILES = `${process.cwd()}/config/schemas/*.*`;

export const defaultConfig: Config = {
  presetFiles: [SERVICE_SETUP_PRESET_FILES],
  schemaFiles: [SERVICE_SETUP_SCHEMA_FILES],
  configFiles: [SERVICE_SETUP_CONFIG_FILES],
};
// #endregion
