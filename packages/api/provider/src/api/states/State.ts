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

import { Crash } from '@mdf/crash';
import { ProviderState } from '../../types';

/** Provider state interface */
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
  /** Pause the process: pause internal jobs */
  pause(): Promise<void>;
  /** Resume the process: resume internal jobs */
  resume(): Promise<void>;
}
