/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

export enum SASLCodes {
  /** The SASL outcome code for a successful authentication. */
  OK = 0,
  /** The SASL outcome code for a temporary failure. */
  AUTH = 1,
  /** The SASL outcome code for a permanent failure. */
  SYS = 2,
  /** The SASL outcome code for a system error. */
  SYS_PERM = 3,
  /** The SASL outcome code for a transient error. */
  SYS_TEMP = 4,
}
