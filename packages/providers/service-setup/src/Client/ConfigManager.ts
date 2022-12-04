/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash, Multi } from '@mdf.js/crash';
import { DoorKeeper } from '@mdf.js/doorkeeper';
import { DebugLogger } from '@mdf.js/logger';
import { formatEnv } from '@mdf.js/utils';
import fs from 'fs';
import glob from 'glob';
import { cloneDeep, merge } from 'lodash';
import path from 'path';
import { v4 } from 'uuid';
import YAML from 'yaml';
import { ServiceSetupOptions } from './types';

type FileEntry = [string, string];

/** Class responsible of file management, both configuration file as validator files  */
export class ConfigManager<Config extends Record<string, unknown> = Record<string, unknown>> {
  /** Unique identifier */
  private uuid: string = v4();
  /** Logger instance for deep debugging tasks */
  private logger = new DebugLogger(`mdf:ConfigManager`);
  /** Configuration checker based on DoorKeeper */
  private readonly checker?;
  /** Presets configuration map */
  public readonly presets: Record<string, Partial<Config>> = {};
  /** Default configuration */
  public readonly defaultConfig: Partial<Config> = {};
  /** Environment configuration */
  public readonly envConfig: Partial<Config> = {};
  /** Final configuration */
  public readonly config: Partial<Config> = {};
  /** Validation error, if exist */
  private _error?: Multi;
  /**
   * Creates a new instance of the file manager
   * @param options - Service setup options
   */
  constructor(private readonly options: ServiceSetupOptions) {
    this.checker = this.loadSchemas(options.schemaFiles);
    this.presets = this.loadPresets(options.presetFiles);
    this.defaultConfig = this.loadConfigFile(options.configFiles);
    this.envConfig = this.loadConfigEnv(options.envPrefix);
    this.config = this.validate(
      merge(cloneDeep(this.selectConfig()), this.envConfig),
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
  private selectConfig(): Partial<Config> {
    if (this.options.preset) {
      if (this.presets[this.options.preset]) {
        return this.presets[this.options.preset];
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
  private validate(config: Partial<Config>, schema?: string): Partial<Config> {
    if (schema && this.checker) {
      try {
        return this.checker.attempt(schema, config, this.uuid);
      } catch (rawError) {
        const cause = Crash.from(rawError);
        this.addError(new Crash(`Configuration validation failed: ${cause.message}`, { cause }));
        return config;
      }
    } else {
      return config;
    }
  }
  /**
   * Load the configuration from the environment variables
   * @param prefix - Prefix to use to filter the environment variables
   * @returns
   */
  private loadConfigEnv(prefix?: string): Partial<Config> {
    if (prefix) {
      return formatEnv(prefix) as Partial<Config>;
    } else {
      return {};
    }
  }
  /**
   * Load the preset files and return the final configuration
   * @param patterns - List of patterns to be used to find config files
   * @returns
   */
  private loadConfigFile(patterns?: string[]): Partial<Config> {
    let config: Partial<Config> = {};
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
  private loadPresets(patterns?: string[]): Record<string, Partial<Config>> {
    const presets: Record<string, Partial<Config>> = {};
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
      files.push(...glob.sync(pattern));
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
  private parse(filename: string, content: string): Partial<Config> | undefined {
    let jsonParseError: Crash | undefined = undefined;
    try {
      return JSON.parse(content);
    } catch (rawError) {
      const cause = Crash.from(rawError);
      jsonParseError = new Crash(`Error parsing JSON in file ${filename}`, {
        cause,
      });
    }
    try {
      return YAML.parse(content);
    } catch (rawError) {
      if (jsonParseError) {
        this.addError(jsonParseError);
      }
      const cause = Crash.from(rawError);
      this.addError(new Crash(`Error parsing YAML in file ${filename}`, { cause }));
      return undefined;
    }
  }
}
