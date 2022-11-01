/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Mytra Control S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Mytra Control S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Mytra Control S.L.
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
