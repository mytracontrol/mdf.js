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
import ENV from 'dotenv';
import escalade from 'escalade/sync';
import fs from 'fs';
import glob from 'glob';
import { cloneDeep, merge } from 'lodash';
import normalize, { Input, Package } from 'normalize-package-data';
import path from 'path';
import TOML from 'toml';
import { v4 } from 'uuid';
import YAML from 'yaml';
import { ServiceSetupOptions } from './types';

type FileEntry = [string, string];

/** Class responsible of file management, both configuration file as validator files  */
export class ConfigManager<Config extends Record<string, any> = Record<string, any>> {
  /** Unique identifier */
  private readonly uuid: string = v4();
  /** Logger instance for deep debugging tasks */
  private readonly logger = new DebugLogger(`mdf:config-manager`);
  /** Configuration checker based on DoorKeeper */
  private readonly checker?;
  /** Presets configuration map */
  public readonly presets: Record<string, Partial<Config>> = {};
  /** Default configuration */
  public readonly defaultConfig: Partial<Config> = {};
  /** Environment configuration */
  public readonly envConfig: Partial<Config> = {};
  /** Final configuration */
  public readonly config: Config;
  /** Package version info */
  public readonly package?: Package;
  /** Validation error, if exist */
  private _error?: Multi;
  /**
   * Creates a new instance of the file manager
   * @param options - Service setup options
   */
  constructor(private readonly options: ServiceSetupOptions) {
    this.checker = this.loadSchemas(options.schemaFiles);
    this.presets = this.loadPresets(options.presetFiles);
    this.defaultConfig = this.loadDefaultConfigFiles(options.configFiles);
    this.envConfig = this.loadConfigEnv(options.envPrefix);
    this.config = this.validate(
      merge(cloneDeep(this.selectConfig()), this.envConfig),
      options.schema
    );
    this.package = this.loadPackageInfo();
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
  private validate(config: Partial<Config>, schema?: string): Config {
    if (schema && this.checker) {
      try {
        return this.checker.attempt(schema, config, this.uuid);
      } catch (rawError) {
        const cause = Crash.from(rawError);
        this.addError(new Crash(`Configuration validation failed: ${cause.message}`, { cause }));
        return this.defaultConfig as Config;
      }
    } else {
      return config as Config;
    }
  }
  /**
   * Load the package.json file information
   * @returns
   */
  private loadPackageInfo(): Package | undefined {
    let packageInfo: Package | undefined;
    try {
      const packagePath = escalade(process.cwd(), (dir, names) => {
        return names.includes('package.json') && 'package.json';
      });
      if (packagePath) {
        packageInfo = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        normalize(packageInfo as Input);
      }
    } catch (rawError) {
      const cause = Crash.from(rawError);
      this.addError(new Crash(`Error loading package info: ${cause.message}`, { cause }));
    }
    return packageInfo;
  }
  /**
   * Load the configuration from the environment variables
   * @param prefix - Prefix to use to filter the environment variables
   * @returns
   */
  private loadConfigEnv(
    prefix?: string | string[] | Record<string, string>,
    source: Record<string, string | undefined> = process.env
  ): Partial<Config> {
    if (typeof prefix === 'string') {
      return formatEnv(prefix, {}, source);
    } else if (Array.isArray(prefix)) {
      return prefix.reduce((acc, item) => merge(acc, formatEnv(item, {}, source)), {});
    } else if (typeof prefix === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(prefix)) {
        result[key] = formatEnv(value, {}, source);
      }
      return result as Partial<Config>;
    } else {
      return {};
    }
  }
  /**
   * Load the preset files and return the final configuration
   * @param patterns - List of patterns to be used to find config files
   * @returns
   */
  private loadDefaultConfigFiles(patterns?: string[]): Partial<Config> {
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
  private parse(filePath: string, content: string): Partial<Config> | undefined {
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
  private parseJSON(content: string): Partial<Config> | undefined {
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
  private parseYAML(content: string): Partial<Config> | undefined {
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
  private parseTOML(content: string): Partial<Config> | undefined {
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
  private parseENV(content: string): Partial<Config> | undefined {
    try {
      return this.loadConfigEnv(this.options.envPrefix, ENV.parse(content));
    } catch (rawError) {
      const cause = Crash.from(rawError);
      throw new Crash(`Error parsing ENV`, { cause });
    }
  }
}
