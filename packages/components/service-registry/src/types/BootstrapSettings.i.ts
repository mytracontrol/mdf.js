/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

export interface BootstrapOptions {
  /**
   * List of files with deploying options to be loaded. The entries could be a file path or
   * glob pattern. It supports configurations in JSON, YAML, TOML, and .env file formats.
   * @example `['./config/*.json']`
   * @example `['./config/logger.json', './config/metadata.yaml']`
   */
  configFiles?: string[];
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
   * Flag indicating that the environment configuration variables should be used. The configuration
   * loaded by environment variables will be merged with the rest of the configuration, overriding
   * the configuration from files, but not the configuration passed as argument to Service Registry.
   * When option is set some filters are applied to the environment variables to avoid conflicts in
   * the configuration. The filters are:
   *
   * - `CONFIG_METADATA_`: Application metadata configuration.
   * - `CONFIG_OBSERVABILITY_`: Observability service configuration.
   * - `CONFIG_LOGGER_`: Logger configuration.
   * - `CONFIG_RETRY_OPTIONS_`: Retry options configuration.
   * - `CONFIG_ADAPTER_`: Consumer adapter configuration.
   *
   * The loader expect environment configuration variables represented in `SCREAMING_SNAKE_CASE`,
   * that will parsed to `camelCase` and merged with the rest of the configuration. The consumer
   * adapter configuration is an exception, due to the kind of configuration, it should be provided
   * by configuration parameters.
   *
   * @example
   * ```sh
   * CONFIG_METADATA_NAME=MyApp
   * CONFIG_METADATA_LINKS__SELF=https://myapp.com
   * CONFIG_OBSERVABILITY_PORT=8080
   * CONFIG_LOGGER__CONSOLE__LEVEL=info
   * CONFIG_RETRY_OPTIONS_ATTEMPTS=3
   * CONFIG_ADAPTER_TYPE=redis
   * ```
   */
  useEnvironment?: boolean;
  /**
   * Flag indicating that the package.json file should be loaded. If this flag is set to `true`, the
   * the module will scale parent directories looking for a `package.json` file to load, if the file
   * is found, the package information will be used to fullfil the `metadata` field.
   * - `package.name` will be used as the `metadata.name`.
   * - `package.version` will be used as the `metadata.version`, and the first part of the version
   *  will be used as the `metadata.release`.
   * - `package.description` will be used as the `metadata.description`.
   * - `package.keywords` will be used as the `metadata.tags`.
   * - `package.config.${name}`, where `name` is the name of the configuration, will be used to find
   * the rest of properties with the same name that in the metadata.
   * This information will be merged with the rest of the configuration, overriding the
   * configuration from files, but not the configuration passed as argument to Service Registry.
   */
  loadPackage?: boolean;
  /**
   * Flag indicating that the README.md file should be loaded. If this flag is set to `true`, the
   * module will scale parent directories looking for a `README.md` file to load, if the file is
   * found, the README content will be exposed in the observability endpoints.
   * If the flag is a string, the string will be used as the file name to look for.
   */
  loadReadme?: boolean | string;
  /**
   * Flag indicating if the OpenC2 Consumer command interface should be enabled. The command
   * interface is a set of commands that can be used to interact with the application.
   * The commands are exposed in the observability endpoints and can be used to interact with the
   * service, or, if a consumer adapter is configured, to interact with the service from a central
   * controller.
   */
  consumer?: boolean;
}
