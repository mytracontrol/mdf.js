/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { LoggerInstance } from '@mdf.js/logger';
import { PollingGroup } from './PollingGroup.t';
import { TaskBaseConfig } from './TaskBaseConfig.i';

export interface PollingManagerOptions {
  /** Component identifier */
  componentId: string;
  /** Resource identifier */
  resource: string;
  /** Polling group assigned to this manager */
  pollingGroup: PollingGroup;
  /** Number of cycles on stats */
  cyclesOnStats?: number;
  /** Logger instance */
  logger?: LoggerInstance;
  /** Tasks configuration */
  entries: TaskBaseConfig[];
}
