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
export function formatEnv(): Record<string, any>;
/**
 * Read environment variables (`process.env`), filter them based in the indicated prefix, and return
 * an object with the values sanitized and the keys formatted
 * @param prefix - prefix to filter
 * @returns
 */
export function formatEnv(prefix: string): Record<string, any>;
/**
 * Read environment variables (`process.env`), filter them based in the indicated prefix, and return
 * an object with the values sanitized and the keys formatted based on the specified options
 * @param prefix - prefix to filter
 * @param options - options to be used for key/value parsing and sanitize
 * @returns
 */
export function formatEnv(prefix: string, options: Partial<ReadEnvOptions>): Record<string, any>;
export function formatEnv(
  prefix?: string,
  options: Partial<ReadEnvOptions> = {},
  source: Record<string, string | undefined> = process.env
): Record<string, any> {
  const _options: ReadEnvOptions = merge(DEFAULT_READ_ENV_OPTIONS, options);
  const filteredObject = filterUnprefixed(source, prefix);
  const result: Record<string, any> = {};
  const entries = Object.entries(filteredObject);
  for (const [key, value] of entries) {
    set(result, formatKey(key, _options, prefix), coerce(value, value));
  }
  return result;
}
