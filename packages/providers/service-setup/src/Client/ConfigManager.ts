/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash, Multi } from '@mdf.js/crash';
import { DoorKeeper } from '@mdf.js/doorkeeper';
import { DebugLogger, LoggerInstance, SetContext } from '@mdf.js/logger';
import { formatEnv } from '@mdf.js/utils';
import ENV from 'dotenv';
import fs from 'fs';
import { sync } from 'glob';
import { cloneDeep, get, merge } from 'lodash';
import path from 'path';
import TOML from 'toml';
import { v4 } from 'uuid';
import YAML from 'yaml';
import { ConfigManagerOptions } from './types';

type FileEntry = [string, string];

/** Class responsible of file management, both configuration file as validator files  */
export class ConfigManager<SystemConfig extends Record<string, any> = Record<string, any>> {
  /** Unique identifier */
  private readonly uuid: string = v4();
  /** Logger instance for deep debugging tasks */
  private readonly logger: LoggerInstance;
  /** Configuration checker based on DoorKeeper */
  private readonly checker?;
  /** Presets configuration map */
  public readonly presets: Record<string, Partial<SystemConfig>> = {};
  /** Default configuration */
  public readonly defaultConfig: Partial<SystemConfig> = {};
  /** Environment configuration */
  public readonly envConfig: Partial<SystemConfig> = {};
  /** Final configuration without environment variables */
  public readonly nonDisclosureConfig: Partial<SystemConfig>;
  /** Final configuration */
  public readonly config: SystemConfig;
  /** Validation error, if exist */
  private _error?: Multi;
  /**
   * Creates a new instance of the file manager
   * @param name - Service name
   * @param options - Service setup options
   */
  constructor(
    private readonly name: string,
    private readonly options: ConfigManagerOptions<SystemConfig>,
    logger?: LoggerInstance
  ) {
    this.logger = SetContext(
      logger || new DebugLogger(`mdf:firehose:${this.name}`),
      this.name,
      this.uuid
    );
    this.checker = options.checker ?? this.loadSchemas(options.schemaFiles);
    this.presets = this.loadPresets(options.presetFiles);
    this.defaultConfig = this.loadDefaultConfigFiles(options.configFiles);
    this.envConfig = this.loadConfigEnv(options.envPrefix);
    this.nonDisclosureConfig = cloneDeep(this.selectConfig());
    this.config = this.validate(
      merge(this.nonDisclosureConfig, this.envConfig, this.options.feed),
      options.schema
    );
  }
  /** Flag to indicate that the final configuration has some errors */
  public get isErrored(): boolean {
    return this.error !== undefined;
  }
  /** Validation error, if exist */
  public get error(): Multi | undefined {
    return this._error;
  }
  /** Return the preset used to create the final configuration */
  public get preset(): string | undefined {
    return this.options.preset;
  }
  /** Return the schema used to validate the final configuration */
  public get schema(): string | undefined {
    return this.options.schema;
  }
  /**
   * Gets the value at path of object. If the resolved value is undefined, the defaultValue is
   * returned in its place.
   * @param path - path to the property to get
   * @param defaultValue - default value to return if the property is not found
   * @template T - Type of the property to return
   */
  get<T>(path: string | string[], defaultValue?: any): T | undefined;
  /**
   * Gets the value at path of object. If the resolved value is undefined, the defaultValue is
   * returned in its place.
   * @param key - path to the property to get
   * @param defaultValue - default value to return if the property is not found
   */
  get<P extends keyof SystemConfig>(key: P, defaultValue?: any): SystemConfig[P] | undefined;
  get<T>(path: string | string[], defaultValue?: any): T | undefined {
    return get(this.config, path, defaultValue);
  }
  /** Add a new error to the validation error or create a new one */
  private addError(error: Crash): void {
    this.logger.error(error.message);
    if (this._error) {
      this._error.push(error);
    } else {
      this._error = new Multi(`Error in the service configuration`, { causes: error });
    }
  }
  /**
   * Select the final configuration based on the given options
   * @returns - The final configuration
   */
  private selectConfig(): Partial<SystemConfig> {
    if (this.options.preset) {
      if (this.presets[this.options.preset]) {
        return merge(cloneDeep(this.defaultConfig), this.presets[this.options.preset]);
      } else {
        this.addError(new Crash(`Preset ${this.options.preset} not found`));
        return this.defaultConfig;
      }
    } else {
      return this.defaultConfig;
    }
  }
  /**
   * Perform the validation of the final configuration
   * @param config - Configuration to be validated
   * @param schema - Schema to be used to validate the configuration
   * @returns - The validated configuration
   */
  private validate(config: Partial<SystemConfig>, schema?: string): SystemConfig {
    if (schema && this.checker) {
      try {
        return this.checker.attempt(schema, config, this.uuid);
      } catch (rawError) {
        const cause = Crash.from(rawError);
        this.addError(new Crash(`Configuration validation failed: ${cause.message}`, { cause }));
        return this.defaultConfig as SystemConfig;
      }
    } else {
      return config as SystemConfig;
    }
  }
  /**
   * Load the configuration from the environment variables
   * @param prefix - Prefix to use to filter the environment variables
   * @returns
   */
  private loadConfigEnv(
    prefix?: string | string[] | Record<string, string>,
    source: Record<string, string | undefined> = process.env
  ): Partial<SystemConfig> {
    if (typeof prefix === 'string') {
      return formatEnv(prefix, {}, source);
    } else if (Array.isArray(prefix)) {
      return prefix.reduce((acc, item) => merge(acc, formatEnv(item, {}, source)), {});
    } else if (typeof prefix === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(prefix)) {
        result[key] = formatEnv(value, {}, source);
      }
      return result as Partial<SystemConfig>;
    } else {
      return {};
    }
  }
  /**
   * Load the preset files and return the final configuration
   * @param patterns - List of patterns to be used to find config files
   * @returns
   */
  private loadDefaultConfigFiles(patterns?: string[]): Partial<SystemConfig> {
    let config: Partial<SystemConfig> = {};
    for (const [name, content] of this.listFiles(patterns)) {
      const partialConfig = this.parse(name, content);
      config = merge(config, partialConfig);
    }
    return config;
  }
  /**
   * Load the preset files and return a map with the presets
   * @param patterns - List of patterns to be used to find preset files
   * @returns
   */
  private loadPresets(patterns?: string[]): Record<string, Partial<SystemConfig>> {
    const presets: Record<string, Partial<SystemConfig>> = {};
    for (const [name, content] of this.listFiles(patterns)) {
      const presetName = path.basename(name, path.extname(name)).split('.')[0];
      const preset = this.parse(name, content);
      if (!preset) {
        continue;
      }
      if (presets[presetName]) {
        presets[presetName] = merge(presets[presetName], preset);
      } else {
        presets[presetName] = preset;
      }
    }
    return presets;
  }
  /**
   * Load the schema files and return a DoorKeeper instance
   * @param patterns - List of patterns to be used to find schema files
   * @returns
   */
  private loadSchemas(patterns?: string[]): DoorKeeper | undefined {
    const checker = new DoorKeeper();
    try {
      for (const [name, content] of this.listFiles(patterns)) {
        const schemaName = path.basename(name, path.extname(name));
        const schema = JSON.parse(content);
        checker.register(schemaName, schema);
      }
      return checker;
    } catch (rawError) {
      const cause = Crash.from(rawError);
      this.addError(new Crash(`Error loading schemas: ${cause.message}`, { cause }));
      return undefined;
    }
  }
  /**
   * Return the list of files based on the given patterns
   * @param patterns - List of patterns to be used to find files
   * @returns
   */
  private listFiles(patterns: string[] = []): FileEntry[] {
    const files: string[] = [];
    for (const pattern of patterns) {
      files.push(...sync(pattern));
    }
    try {
      return files
        .filter(filePath => fs.existsSync(filePath))
        .sort()
        .map(filePath => [filePath, fs.readFileSync(filePath, 'utf8')]);
    } catch (rawError) {
      const cause = Crash.from(rawError);
      this.addError(new Crash(`Error loading files: ${cause.message}`, { cause, patterns }));
      return [];
    }
  }
  /**
   * Parse the configuration file and return the final configuration
   * @param content - Content to be parsed
   * @returns
   */
  private parse(filePath: string, content: string): Partial<SystemConfig> | undefined {
    const extension = path.extname(filePath);
    const filename = path.basename(filePath);
    try {
      switch (extension) {
        case '.json':
          return this.parseJSON(content);
        case '.yaml':
        case '.yml':
          return this.parseYAML(content);
        case '.toml':
          return this.parseTOML(content);
        case '.env':
          return this.parseENV(content);
        default:
          this.addError(new Crash(`Unsupported file extension: ${extension} - ${filename}`));
          return undefined;
      }
    } catch (rawError) {
      const cause = Crash.from(rawError);
      this.addError(new Crash(`Error parsing file ${filename}: ${cause.message}`, { cause }));
      return undefined;
    }
  }
  /**
   * Parse a JSON string and a return a partial configuration
   * @param content - Content to be parsed
   * @returns
   */
  private parseJSON(content: string): Partial<SystemConfig> | undefined {
    try {
      return JSON.parse(content);
    } catch (rawError) {
      const cause = Crash.from(rawError);
      throw new Crash(`Error parsing JSON`, { cause });
    }
  }
  /**
   * Parse a YAML string and a return a partial configuration
   * @param content - Content to be parsed
   * @returns
   */
  private parseYAML(content: string): Partial<SystemConfig> | undefined {
    try {
      return YAML.parse(content);
    } catch (rawError) {
      const cause = Crash.from(rawError);
      throw new Crash(`Error parsing YAML`, { cause });
    }
  }
  /**
   * Parse a TOML string and a return a partial configuration
   * @param content - Content to be parsed
   * @returns
   */
  private parseTOML(content: string): Partial<SystemConfig> | undefined {
    try {
      return TOML.parse(content);
    } catch (rawError) {
      const cause = Crash.from(rawError);
      throw new Crash(`Error parsing TOML`, { cause });
    }
  }
  /**
   * Parse a ENV string and a return a partial configuration
   * @param content - Content to be parsed
   * @returns
   */
  private parseENV(content: string): Partial<SystemConfig> | undefined {
    try {
      const variables = ENV.parse(content);
      let prefixes: string[];
      if (typeof this.options.envPrefix === 'string') {
        prefixes = [this.options.envPrefix];
      } else if (Array.isArray(this.options.envPrefix)) {
        prefixes = this.options.envPrefix;
      } else if (typeof this.options.envPrefix === 'object') {
        prefixes = Object.keys(this.options.envPrefix);
      } else {
        prefixes = [];
      }
      for (const [key, value] of Object.entries(variables)) {
        if (prefixes.length === 0 || !prefixes.some(prefix => key.startsWith(prefix))) {
          process.env[key] = value;
        }
      }
      return this.loadConfigEnv(this.options.envPrefix, variables);
    } catch (rawError) {
      const cause = Crash.from(rawError);
      throw new Crash(`Error parsing ENV`, { cause });
    }
  }
}
