/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Mytra Control S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Mytra Control S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Mytra Control S.L.
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
