/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { merge, set } from 'lodash';
import { coerce } from '../coerce';
import { ReadEnvOptions } from './types';
import { filterUnprefixed, formatKey } from './utils';

const DEFAULT_READ_ENV_OPTIONS: ReadEnvOptions = {
  format: 'camelcase',
  separator: '__',
  includePrefix: false,
};
/**
 * Read environment variables (`process.env`) and return an object with the values sanitized and the
 * keys formatted
 * @returns
 */
export function formatEnv<T extends Record<string, any> = Record<string, any>>(): T;
/**
 * Read environment variables (`process.env`), filter them based in the indicated prefix, and return
 * an object with the values sanitized and the keys formatted
 * @param prefix - prefix to filter
 * @returns
 */
export function formatEnv<T extends Record<string, any> = Record<string, any>>(prefix: string): T;
/**
 * Read environment variables (`process.env`), filter them based in the indicated prefix, and return
 * an object with the values sanitized and the keys formatted based on the specified options
 * @param prefix - prefix to filter
 * @param options - options to be used for key/value parsing and sanitize
 * @returns
 */
export function formatEnv<T extends Record<string, any> = Record<string, any>>(
  prefix: string,
  options: Partial<ReadEnvOptions>
): T;
export function formatEnv<T extends Record<string, any> = Record<string, any>>(
  prefix?: string,
  options: Partial<ReadEnvOptions> = {},
  source: Record<string, string | undefined> = process.env
): T {
  const _options: ReadEnvOptions = merge(DEFAULT_READ_ENV_OPTIONS, options);
  const filteredObject = filterUnprefixed(source, prefix);
  const result: Record<string, any> = {};
  const entries = Object.entries(filteredObject);
  for (const [key, value] of entries) {
    set(result, formatKey(key, _options, prefix), coerce(value, value));
  }
  return result as T;
}
