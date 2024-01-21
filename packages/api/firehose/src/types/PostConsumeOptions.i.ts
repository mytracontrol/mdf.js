/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

export interface PostConsumeOptions {
  /** Number of unknown jobs to register */
  maxUnknownJobs?: number;
  /** Time to wait between check buffer of uncleaned entries */
  checkUncleanedInterval?: number;
}
