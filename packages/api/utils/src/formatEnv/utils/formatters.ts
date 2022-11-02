/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { camelCase } from '../../camelCase';
import { Format, FormatFunction, ReadEnvOptions } from '../types';
/**
 * Transform a string to a given format
 * @param key - key to be formatted
 * @param options - options to be applied
 * @param prefix - key prefix
 * @returns
 */
export function formatKey(key: string, options: ReadEnvOptions, prefix?: string): string {
  let result = key;
  if (!options.includePrefix && typeof prefix === 'string') {
    result = trimLeft(result, prefix);
  }
  result = trimLeft(result, '_');
  result = result
    .split(options.separator)
    .map(entry => transformKey(entry, options.format))
    .join('.');
  return result;
}
/**
 * Transform a string to a given standard format
 * @param key - key to be formatted
 * @param format - format to be applied
 * @returns
 */
function transformKey(key: string, format?: Format | FormatFunction): string {
  if (typeof format === 'function') {
    return format(key);
  } else {
    switch (format) {
      case 'camelcase':
        return camelCase(key);
      case 'pascalcase':
        return camelCase(key, { pascalCase: true });
      case 'uppercase':
        return key.toUpperCase();
      case 'lowercase':
        return key.toLowerCase();
      default:
        return key;
    }
  }
}
/**
 * Remove the indicated string from left part of the key
 * @param key - key to be formatted
 * @param find - list of characters to be removed
 * @returns
 */
function trimLeft(key: string, find: string): string {
  return key.replace(new RegExp(`^[${find}]+`), '');
}
