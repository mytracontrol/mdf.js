/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { ProviderState } from '../types';

/**
 * Provider state interface
 * @category State
 * @public
 */
export interface State {
  /** Actual provider state */
  state: ProviderState;
  /** Initialize the process: internal jobs, external dependencies connections ... */
  start(): Promise<void>;
  /** Stop the process: internal jobs, external dependencies connections ... */
  stop(): Promise<void>;
  /**
   * Go to error state: waiting for new state o auto-fix de the problems
   * @param error - incoming error from provider
   */
  fail(error: Crash | Error): Promise<void>;
}
