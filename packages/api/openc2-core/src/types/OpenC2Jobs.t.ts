/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { JobHandler, Jobs } from '@mdf.js/core';
import { Control } from '.';

export type CommandJobHandler = JobHandler<'command', Control.CommandMessage>;
export type CommandJobDone = Jobs.Result<'command'> & { command: Control.CommandMessage };
