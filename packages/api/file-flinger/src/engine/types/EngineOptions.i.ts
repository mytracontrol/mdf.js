/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { FileTasksOptions } from './FileTasksOptions.i';

/** Engine options */
export interface EngineOptions extends FileTasksOptions {
  /** The name of the watcher */
  name: string;
  /** The component identifier */
  componentId: string;
  /** Delay between retries failed file processing operations */
  failedOperationDelay?: number;
}
