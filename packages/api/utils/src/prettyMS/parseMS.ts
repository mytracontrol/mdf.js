/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { TimeComponents } from './TimeComponents.i';

/**
 * Parse milliseconds into an object.
 * @example
 * ```
 * import parseMilliseconds from 'parse-ms';
 * parseMilliseconds(1337000001);
 * // {
 * // 	days: 15,
 * // 	hours: 11,
 * // 	minutes: 23,
 * // 	seconds: 20,
 * // 	milliseconds: 1,
 * // 	microseconds: 0,
 * // 	nanoseconds: 0
 * // }
 * ```
 */
export function parseMS(milliseconds: number): TimeComponents {
  if (typeof milliseconds !== 'number') {
    throw new TypeError('Expected a number');
  }

  return {
    days: Math.trunc(milliseconds / 86400000),
    hours: Math.trunc(milliseconds / 3600000) % 24,
    minutes: Math.trunc(milliseconds / 60000) % 60,
    seconds: Math.trunc(milliseconds / 1000) % 60,
    milliseconds: Math.trunc(milliseconds) % 1000,
    microseconds: Math.trunc(milliseconds * 1000) % 1000,
    nanoseconds: Math.trunc(milliseconds * 1e6) % 1000,
  };
}
