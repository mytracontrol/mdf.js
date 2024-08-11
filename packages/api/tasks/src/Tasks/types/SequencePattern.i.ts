/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { TaskHandler } from '../TaskHandler';

/** Represents the pattern for task execution as a sequence of tasks */
export interface SequencePattern<T = any> {
  /** Tasks to be executed before the main task */
  pre?: TaskHandler[];
  /**
   * Tasks to be executed after the main task, if the main task fails, the post tasks will not be
   * executed, but the finally tasks will be executed.
   */
  post?: TaskHandler[];
  /** The main task to be executed */
  task: TaskHandler<T>;
  /**
   * Tasks to be executed at the end of the sequence, the finally tasks will be executed even if the
   * main task fails.
   */
  finally?: TaskHandler[];
}
