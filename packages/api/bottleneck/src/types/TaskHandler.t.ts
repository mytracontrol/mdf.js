/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Jobs } from '@mdf.js/core';

/** Job headers used to pass specific information for jobs handlers */
export type TaskHeaders = {
  /** The priority of the job */
  priority: number;
  /** The weight of the job */
  weight: number;
};

/** Represents the task handler */
export type TaskHandler<T> = Jobs.JobHandler<'task', (() => Promise<T>) | T, TaskHeaders>;

export const TaskHandler = Jobs.JobHandler;
