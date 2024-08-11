/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { File } from './File.i';
/** A "Process" Target MUST contain at least one property */
export interface Process {
  /** The full command line invocation used to start this process, including all arguments */
  command_line?: string;
  /** Current working directory of the process */
  cwd?: string;
  /** Executable that was executed to start the process */
  executable?: File;
  /** Name of the process */
  name?: string;
  /** Process that spawned this one */
  parent?: Process;
  /** Process ID of the process */
  pid?: number;
}
