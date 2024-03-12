/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Represent the state of a task */
export enum TASK_STATE {
  /** The task has been created, but not yet started */
  PENDING = 'pending',
  /** The task is being processed in this moment */
  RUNNING = 'running',
  /** The task has finished successfully */
  COMPLETED = 'completed',
  /** The task has been cancelled */
  CANCELLED = 'cancelled',
  /** The task has finished with an error */
  FAILED = 'failed',
}
/** Represent the state of a task */
export type TaskState =
  | TASK_STATE.CANCELLED
  | TASK_STATE.COMPLETED
  | TASK_STATE.FAILED
  | TASK_STATE.PENDING
  | TASK_STATE.RUNNING;

/** List of all possible task states */
export const TASK_STATES: TaskState[] = Object.values(TASK_STATE);
