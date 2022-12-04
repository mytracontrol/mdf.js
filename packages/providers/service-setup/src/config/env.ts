/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Config } from '../provider';
import { CONFIG_ARTIFACT_ID } from './utils';
// *************************************************************************************************
// #region Environment variables
const CONFIG_SERVICE_SETUP_NAME = process.env['CONFIG_SERVICE_SETUP_NAME'] || CONFIG_ARTIFACT_ID;
const CONFIG_SERVICE_SETUP_PRESET_FILES = process.env['CONFIG_SERVICE_SETUP_PRESET_FILES'];
const CONFIG_SERVICE_SETUP_SCHEMA_FILES = process.env['CONFIG_SERVICE_SETUP_SCHEMA_FILES'];
const CONFIG_SERVICE_SETUP_CONFIG_FILES = process.env['CONFIG_SERVICE_SETUP_CONFIG_FILES'];
const CONFIG_SERVICE_SETUP_PRESET = process.env['CONFIG_SERVICE_SETUP_PRESET'];
const CONFIG_SERVICE_SETUP_SCHEMA = process.env['CONFIG_SERVICE_SETUP_SCHEMA'];
const CONFIG_SERVICE_SETUP_ENV_PREFIX = process.env['CONFIG_SERVICE_SETUP_ENV_PREFIX'];

export const envBasedConfig: Config = {
  name: CONFIG_SERVICE_SETUP_NAME,
  presetFiles: CONFIG_SERVICE_SETUP_PRESET_FILES?.split(',') ?? undefined,
  schemaFiles: CONFIG_SERVICE_SETUP_SCHEMA_FILES?.split(',') ?? undefined,
  configFiles: CONFIG_SERVICE_SETUP_CONFIG_FILES?.split(',') ?? undefined,
  preset: CONFIG_SERVICE_SETUP_PRESET,
  schema: CONFIG_SERVICE_SETUP_SCHEMA,
  envPrefix: CONFIG_SERVICE_SETUP_ENV_PREFIX,
};
// #endregion
