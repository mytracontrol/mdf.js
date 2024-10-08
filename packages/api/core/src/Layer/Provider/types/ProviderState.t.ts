/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Provider states */
export const PROVIDER_STATES = ['running', 'stopped', 'error'] as const;
/** Provider state type */
export type ProviderState = (typeof PROVIDER_STATES)[number];
/** Provider status */
export enum ProviderStatus {
  'running' = 'pass',
  'stopped' = 'warn',
  'error' = 'fail',
}
