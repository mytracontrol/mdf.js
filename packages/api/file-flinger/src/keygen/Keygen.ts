/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { DebugLogger, SetContext, type LoggerInstance } from '@mdf.js/logger';
import { merge } from 'lodash';
import path from 'path';
import { v4 } from 'uuid';
import { DEFAULT_KEY_GEN_OPTIONS, InternalKeygenOptions, type KeygenOptions } from './types';

/**
 * Key generator for the files
 * The key generator is used to generate a key for a file based on a given pattern.
 * The key pattern can contain placeholders that will be replaced by the actual values.
 * The placeholders are enclosed in curly braces and the following are supported by default:
 * - {_filename}: The name of the file
 * - {_extension}: The extension of the file
 * - {_timestamp}: The timestamp when the file was processed in milliseconds
 * - {_date}: The date when the file was processed in the format YYYY-MM-DD
 * - {_time}: The time when the file was processed in the format HH-mm-ss
 * - {_datetime}: The date and time when the file was processed in the format YYYY-MM-DD_HH-mm-ss
 * - {_year}: The year when the file was processed
 * - {_month}: The month when the file was processed
 * - {_day}: The day when the file was processed
 * - {_hour}: The hour when the file was processed
 * - {_minute}: The minute when the file was processed
 * - {_second}: The second when the file was processed
 *
 * Other placeholders can be added by appling a custom file pattern over the file name, and using default values:
 * - file name: mySensor_flowMeter1_2024-12-30_2024-12-31.jsonl
 * - file pattern: {sensor}_{measurement}_{year}-{month}-{day}_{end}
 * - default values: {source: 'myFileFlinger1'}
 * - key pattern: {sensor}/{measurement}/{year}/{month}/{day}/data_{source}
 * - key: mySensor/flowMeter1/2024/12/30/data_myFileFlinger1
 */
export class Keygen {
  /** Debug logger for development and deep troubleshooting */
  private readonly logger: LoggerInstance;
  /** The options for the key generator */
  private readonly options: InternalKeygenOptions;
  /**
   * Creates a new key generator instance with the given options.
   * @param options The options for the key generator
   * @param logger The logger instance for deep debugging tasks
   */
  constructor(options?: KeygenOptions, logger?: LoggerInstance) {
    this.options = merge({}, DEFAULT_KEY_GEN_OPTIONS, options);
    // Stryker disable next-line all
    this.logger = SetContext(logger || new DebugLogger(`mdf:fileFlinger:keygen`), 'keygen', v4());
  }
  /**
   * Parses a file name according to a given pattern and returns a map of placeholder values.
   * @param fileName - The actual file name to parse.
   * @returns A map where keys are placeholder names and values are the corresponding parts from the file name.
   * @throws An error if the file name does not match the pattern.
   */
  private parseFileName(fileName: string): Record<string, string> {
    // Return an empty object if no file pattern is defined
    if (!this.options.filePattern) {
      return {};
    }
    // Escape special regex characters except for curly braces
    const escapedPattern = this.options.filePattern.replace(/([.+^$[\]\\(){}|-])/g, '\\$1');

    // Replace placeholders with named capture groups, excluding only the field separator '_'
    const regexPattern = escapedPattern.replace(/\\{([^}]+)\\}/g, (_, key) => `(?<${key}>[^_]+)`);

    // Create a RegExp object with start and end anchors
    const regex = new RegExp(`^${regexPattern}$`);

    // Match the file name against the regex pattern
    const match = regex.exec(fileName);

    if (!match?.groups) {
      const error = new Crash(
        `Filename [${fileName}] does not match the pattern [${this.options.filePattern}]`
      );
      this.logger.debug(error.message);
      throw error;
    }

    // Return the captured groups as a key-value map
    return match.groups;
  }
  /**
   * Generates a map of placeholder values based in a given file path and on the current date and
   * time.
   * @param filePath - The path to the file.
   * @returns A map where keys are placeholder names and values are placeholders values.
   */
  private generatePlaceholders(filePath: string): Record<string, string> {
    const date = new Date();
    const placeholders: Record<string, string> = {};

    placeholders['_filename'] = path.basename(filePath, path.extname(filePath));
    placeholders['_extension'] = path.extname(filePath);
    placeholders['_timestamp'] = date.getTime().toString();
    placeholders['_date'] = date.toISOString().split('T')[0];
    placeholders['_time'] = date.toTimeString().split(' ')[0].replace(/:/g, '-');
    placeholders['_datetime'] = date
      .toISOString()
      .replace(/[-:]/g, '-')
      .replace('T', '_')
      .split('.')[0];
    placeholders['_year'] = date.getFullYear().toString();
    placeholders['_month'] = (date.getMonth() + 1).toString().padStart(2, '0');
    placeholders['_day'] = date.getDate().toString().padStart(2, '0');
    placeholders['_hour'] = date.getHours().toString().padStart(2, '0');
    placeholders['_minute'] = date.getMinutes().toString().padStart(2, '0');
    placeholders['_second'] = date.getSeconds().toString().padStart(2, '0');

    // Merge parsed parts with default values
    return placeholders;
  }
  /**
   * Generates a key for a file based on a given pattern.
   * @param filePath - The path to the file.
   * @returns The generated key.
   */
  public generateKey(filePath: string): string {
    const fileName = path.basename(filePath);

    // Merge parsed parts with default values
    const placeholders = {
      ...this.options.defaultValues,
      ...this.generatePlaceholders(filePath),
      ...this.parseFileName(fileName),
    };
    this.logger.debug(`Generated placeholders:\n ${JSON.stringify(placeholders, null, 2)}`);
    const key = this.options.keyPattern.replace(/{([^}]+)}/g, (_, key) => {
      if (!placeholders[key]) {
        const error = new Crash(
          `Error generating a key based on pattern [${this.options.keyPattern}] for file [${fileName}]: Placeholder [${key}] not found in values`
        );
        this.logger.debug(error.message);
        throw error;
      }
      return placeholders[key];
    });
    this.logger.debug(`Generated key: ${key}`);
    return key;
  }
}
