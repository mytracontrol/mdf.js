/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

export enum Status {
  /** Job is pending */
  PENDING = 'pending',
  /** Job is processing */
  PROCESSING = 'processing',
  /** Job has been resolved */
  COMPLETED = 'completed',
  /** Job has been complete with failures */
  FAILED = 'failed',
}
