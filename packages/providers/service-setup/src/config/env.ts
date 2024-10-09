/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Config } from '../provider';
// *************************************************************************************************
// #region Environment variables

/**
 * List of files with preset options to be loaded. The entries could be a file path or glob
 * pattern. The first part of the file name will be used as the preset name. The file name
 * should be in the format of `presetName.config.json` or `presetName.config.yaml`. The name of
 * the preset will be used to merge different files in order to create a single preset.
 * @defaultValue './config/presets/*.*'
 */
const CONFIG_SERVICE_SETUP_PRESET_FILES = process.env['CONFIG_SERVICE_SETUP_PRESET_FILES'];
/**
 * List of files with JSON schemas used to validate the configuration. The entries could be a
 * file path or glob pattern.
 * @defaultValue './config/schemas/*.*'
 */
const CONFIG_SERVICE_SETUP_SCHEMA_FILES = process.env['CONFIG_SERVICE_SETUP_SCHEMA_FILES'];
/**
 * List of configuration files to be loaded. The entries could be a file path or glob pattern.
 * All the files will be loaded and merged in the order they are founded. The result of the merge
 * will be used as the final configuration.
 * @defaultValue './config/*.*'
 */
const CONFIG_SERVICE_SETUP_CONFIG_FILES = process.env['CONFIG_SERVICE_SETUP_CONFIG_FILES'];
/**
 * Preset to be used as configuration base, if none is indicated, or the indicated preset is
 * not found, the configuration from the configuration files will be used.
 * @defaultValue undefined
 */
const CONFIG_SERVICE_SETUP_PRESET = process.env['CONFIG_SERVICE_SETUP_PRESET'];
/**
 * Schema to be used to validate the configuration. If none is indicated, the configuration will
 * not be validated. The schema name should be the same as the file name without the extension.
 * @defaultValue undefined
 */
const CONFIG_SERVICE_SETUP_SCHEMA = process.env['CONFIG_SERVICE_SETUP_SCHEMA'];
/**
 * Prefix or prefixes to use on configuration loading from the environment variables. The prefix
 * will be used to filter the environment variables. The prefix will be removed from the
 * environment variable name and the remaining part will be used as the configuration property
 * name. The configuration property name will be converted to camel case.
 * Environment variables will override the configuration from the configuration files.
 * @defaultValue undefined
 */
const CONFIG_SERVICE_SETUP_ENV_PREFIX = process.env['CONFIG_SERVICE_SETUP_ENV_PREFIX'];

export const envBasedConfig: Config = {
  presetFiles: CONFIG_SERVICE_SETUP_PRESET_FILES?.split(',') ?? undefined,
  schemaFiles: CONFIG_SERVICE_SETUP_SCHEMA_FILES?.split(',') ?? undefined,
  configFiles: CONFIG_SERVICE_SETUP_CONFIG_FILES?.split(',') ?? undefined,
  preset: CONFIG_SERVICE_SETUP_PRESET,
  schema: CONFIG_SERVICE_SETUP_SCHEMA,
  envPrefix: CONFIG_SERVICE_SETUP_ENV_PREFIX,
};
// #endregion

