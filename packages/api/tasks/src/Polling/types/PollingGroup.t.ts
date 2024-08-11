/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/**
 * Constraints the options for polling groups that should be expressed in seconds(s), minutes(m),
 * hours(h), or days(d)
 */
export type PollingGroup =
  | `${number}d`
  | `${number}h`
  | `${number}m`
  | `${number}s`
  | `${number}ms`;
/** Default period groups */
export type DefaultPollingGroups =
  | '1d'
  | '12h'
  | '6h'
  | '4h'
  | '1h'
  | '30m'
  | '15m'
  | '10m'
  | '5m'
  | '1m'
  | '30s'
  | '10s'
  | '5s';
