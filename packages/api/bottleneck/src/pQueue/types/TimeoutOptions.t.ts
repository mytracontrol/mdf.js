/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

export type TimeoutOptions = {
  /**
   * Per-operation timeout in milliseconds. Operations fulfill once `timeout` elapses if they
   * haven't already.
   */
  timeout?: number;
  /**
   * Whether or not a timeout is considered an exception.
   * @default false
   */
  throwOnTimeout?: boolean;
};
