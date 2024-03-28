/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { TaskState } from './TaskState.t';

/** Metadata of the execution of the task */
export interface MetaData {
  /** Unique task identification, unique for each task */
  uuid: string;
  /** Task identifier, defined by the user */
  taskId: string;
  /** Status of the task */
  status: TaskState;
  /** Date when the task was created */
  createdAt: string;
  /** Date when the task was executed in ISO format */
  executedAt?: string;
  /** Date when the task was completed in ISO format */
  completedAt?: string;
  /** Date when the task was cancelled in ISO format */
  cancelledAt?: string;
  /** Date when the task was failed in ISO format  */
  failedAt?: string;
  /** Reason of failure or cancellation */
  reason?: string;
  /** Duration of the task in milliseconds */
  duration?: number;
  /** Task priority */
  priority: number;
  /** Task weight */
  weight: number;
  /** Additional metadata in case the execution required execute other task */
  $meta?: MetaData[];
}
