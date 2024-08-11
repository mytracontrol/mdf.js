/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Jobs } from '@mdf.js/core';
import { Control } from '.';

export interface CommandJobHeader {
  /** Delay allowed from command message */
  duration: number;
}

export type CommandJobRequest = Jobs.JobRequest<
  'command',
  Control.CommandMessage,
  CommandJobHeader
>;
export type CommandJobHandler = Jobs.JobHandler<
  'command',
  Control.CommandMessage,
  CommandJobHeader
>;
export type CommandJobDone = Jobs.Result<'command'> & { command: Control.CommandMessage };
