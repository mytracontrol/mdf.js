/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

export interface ServiceSetupOptions {
  /** Service name */
  name: string;
  /**
   * List of files with preset options to be loaded. The entries could be a file path or glob
   * pattern. The first part of the file name will be used as the preset name. The file name
   * should be in the format of `presetName.config.json` or `presetName.config.yaml`. The name of
   * the preset will be used to merge different files in order to create a single preset.
   * @example `['./config/presets/*.json']`
   * @example `['./config/presets/*.json', './config/presets/*.yaml']`
   * @example `['./config/presets/*.json', './config/presets/*.yaml', './config/presets/*.yml']`
   */
  presetFiles?: string[];
  /**
   * Preset to be used as configuration base, if none is indicated, or the indicated preset is
   * not found, the configuration from the configuration files preset will be used.
   */
  preset?: string;
  /**
   * List of files with JSON schemas used to validate the configuration. The entries could be a
   * file path or glob pattern.
   */
  schemaFiles?: string[];
  /**
   * Schema to be used to validate the configuration. If none is indicated, the configuration will
   * not be validated. The schema name should be the same as the file name without the extension.
   */
  schema?: string;
  /**
   * List of configuration files to be loaded. The entries could be a file path or glob pattern.
   * All the files will be loaded and merged in the order they are founded. The result of the merge
   * will be used as the final configuration.
   */
  configFiles?: string[];
  /**
   * Prefix to be used to load the configuration from the environment variables. The prefix will be
   * used to filter the environment variables and only the ones that start with the prefix will be
   * loaded. The prefix will be removed from the environment variable name and the remaining part
   * will be used as the configuration property name. The configuration property name will be
   * converted to camel case.
   * Environment variables will override the configuration from the configuration files.
   * @example `MY_APP_`
   */
  envPrefix?: string;
}
