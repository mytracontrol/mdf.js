/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

export enum LimiterState {
  /** The limiter is stopped, no tasks are running and no new tasks will be started */
  STOPPED = 'stopped',
  /** The limiter is running, some tasks are running and some tasks are waiting */
  RUNNING = 'running',
  /** The queue of task are empty but some tasks are running */
  EMPTY = 'empty',
  /** The queue of task are empty and no tasks are running */
  IDLE = 'idle',
  /** The limiter is starting, no tasks are running */
  STARTING = 'starting',
}
