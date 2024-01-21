/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { parseMS } from './parseMS';

/**
 * Convert milliseconds to a human readable string: `1337000000` → `15d 11h 23m 20s`.
 * @param ms - Milliseconds to humanize.
 */
export function prettyMS(ms: number) {
  const time = parseMS(ms);
  const days = time.days ? `${time.days}d ` : '';
  const hours = time.hours ? `${time.hours}h ` : '';
  const minutes = time.minutes ? `${time.minutes}m ` : '';
  const seconds = time.seconds ? `${time.seconds}s ` : '';
  const milliseconds = time.milliseconds ? `${time.milliseconds}ms ` : '';
  return `${days}${hours}${minutes}${seconds}${milliseconds}`.trim();
}
