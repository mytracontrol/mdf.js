/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { isEmpty, isPlainObject, transform } from 'lodash';

/** Options for the cleanDeep function */
export interface CleanDeepOptions {
  /**
   * Array of keys to remove from the object
   * @default []
   */
  cleanKeys?: string[];
  /**
   * Array of values to remove from the object
   * @default []
   */
  cleanValues?: any[];
  /**
   * Remove empty arrays
   * @default true
   */
  emptyArrays?: boolean;
  /**
   * Remove empty objects
   * @default true
   */
  emptyObjects?: boolean;
  /**
   * Remove empty strings
   * @default true
   */
  emptyStrings?: boolean;
  /**
   * Remove NaN values
   * @default false
   */
  NaNValues?: boolean;
  /**
   * Remove null values
   * @default true
   */
  nullValues?: boolean;
  /**
   * Remove undefined values
   * @default true
   */
  undefinedValues?: boolean;
  /**
   * Process nested objects and arrays
   * @default true
   */
  nested?: boolean;
}

const DEFAULT_OPTIONS: CleanDeepOptions = {
  cleanKeys: [],
  cleanValues: [],
  emptyArrays: true,
  emptyObjects: true,
  emptyStrings: true,
  NaNValues: false,
  nullValues: true,
  undefinedValues: true,
  nested: true,
};

/**
 * Removes empty objects, arrays, empty strings, NaN, null and undefined values from objects,
 * including nested ones. Does not alter the original object.
 * @param obj - Object to clean
 * @param options - Options for the cleaning process
 * @returns Cleaned object
 */
export function cleanDeep<T extends Record<string, unknown> | unknown[], R = T>(
  obj: T,
  options: CleanDeepOptions = DEFAULT_OPTIONS
): R {
  const _opts: Required<CleanDeepOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
  } as Required<CleanDeepOptions>;

  for (const key of _opts.cleanKeys) {
    if (typeof key !== 'string') {
      throw new Crash('cleanKeys option must be an array of strings');
    }
  }

  if (!Array.isArray(_opts.cleanValues)) {
    throw new Crash('cleanValues option must be an array');
  }

  if (typeof obj !== 'object' || obj === null) {
    throw new Crash('Only objects and arrays are allowed');
  }

  if (isPlainObject(obj)) {
    return _processObject(obj as Record<string, unknown>, _opts) as R;
  } else {
    return _processArray(obj as unknown[], _opts) as R;
  }
}

/**
 * Processes an array by mapping and filtering its values based on the provided options.
 *
 * @param arr - The array to be processed.
 * @param options - The options used to process the array. This includes required options for cleaning deep.
 * @returns A new array with processed and filtered values.
 */
function _processArray(arr: unknown[], options: Required<CleanDeepOptions>): unknown[] {
  let result: unknown[] = arr
    .map(value => _processNestedEntries(value, options))
    .filter(value => _filterFunction(value, options));
  return result;
}

/**
 * Processes an object by transforming its entries based on the provided options.
 *
 * @param obj - The object to be processed.
 * @param options - The options to be used for processing the object.
 * @returns A new object with the processed entries.
 */
function _processObject(
  obj: Record<string, unknown>,
  options: Required<CleanDeepOptions>
): Record<string, unknown> {
  const result = transform<any, any>(obj, (acc, value, key) => {
    let _value = _processNestedEntries(value, options);
    if (!_filterFunction(_value, options, key)) {
      return;
    }
    acc[key] = _value;
  });
  return result;
}

/**
 * Processes nested entries within an object or array based on the provided options.
 *
 * @param value - The value to process, which can be an object, array, or any other type.
 * @param options - The options to use for processing, which must include the `nested` property.
 * @returns The processed value, which will be an object, array, or the original value if no processing is needed.
 */
function _processNestedEntries(value: unknown, options: Required<CleanDeepOptions>): unknown {
  if (isPlainObject(value) && options.nested) {
    return _processObject(value as Record<string, unknown>, options);
  } else if (Array.isArray(value) && options.nested) {
    return _processArray(value as unknown[], options);
  } else {
    return value;
  }
}

/**
 * Filters out values based on the provided options.
 *
 * @param value - The value to be checked.
 * @param options - The options to determine which values should be filtered out.
 * @param key - The key associated with the value, if any.
 * @returns `false` if the value should be filtered out, otherwise `true`.
 */
function _filterFunction(
  value: unknown,
  options: Required<CleanDeepOptions>,
  key?: string
): boolean {
  if (
    (options.emptyArrays && Array.isArray(value) && value.length === 0) ||
    (options.emptyObjects && isPlainObject(value) && isEmpty(value)) ||
    (options.emptyStrings && typeof value === 'string' && value.trim() === '') ||
    (options.NaNValues && Number.isNaN(value)) ||
    (options.nullValues && value === null) ||
    (options.undefinedValues && value === undefined) ||
    options.cleanValues.includes(value) ||
    (typeof key === 'string' && options.cleanKeys.includes(key))
  ) {
    return false;
  }
  return true;
}
