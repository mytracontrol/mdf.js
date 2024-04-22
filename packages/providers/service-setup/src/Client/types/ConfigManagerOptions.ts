/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { DoorKeeper } from '@mdf.js/doorkeeper';

export interface ConfigManagerOptions<
  SystemConfig extends Record<string, any> = Record<string, any>,
> {
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
   * not found, the configuration from the configuration files will be used.
   */
  preset?: string;
  /**
   * List of files with JSON schemas used to validate the configuration. The entries could be a
   * file path or glob pattern.
   */
  schemaFiles?: string[];
  /**
   * DoorKeeper instance to be used to validate the configuration. If none is indicated, the setup
   * instance will be try to create a new DoorKeeper instance using the schema files indicated in
   * the options. If the schema files are not indicated, the configuration will not be validated.
   */
  checker?: DoorKeeper;
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
   * Prefix or prefixes to use on configuration loading from the environment variables. The prefix
   * will be used to filter the environment variables. The prefix will be removed from the
   * environment variable name and the remaining part will be used as the configuration property
   * name. The configuration property name will be converted to camel case.
   * Environment variables will override the configuration from the configuration files.
   * @example
   * ```ts
   * `MY_APP_` // as single prefix
   * ['MY_APP_', 'MY_OTHER_APP_'] // as array of prefixes
   * { MY_APP: 'myApp', MY_OTHER_APP: 'myOtherApp' } // as object with prefixes
   * ```
   */
  envPrefix?: string | string[] | Record<string, string>;
  /**
   * Object to be used as base and main configuration options. The configuration will be merged with
   * the configuration from the configuration files. This object will override the configuration
   * from the configuration files and the environment variables. The main reason of this option is
   * to allow the user to define some configuration in the code and let the rest of the
   * configuration to be loaded, using the Configuration Manager as unique source of configuration.
   */
  base?: Partial<SystemConfig>;
  /**
   * Object to be used as default configuration options. The configuration will be merged with the
   * configuration from the configuration files, the environment variables and the base option. This
   * object will be used as the default configuration if no other configuration is found.
   */
  default?: Partial<SystemConfig>;
}
