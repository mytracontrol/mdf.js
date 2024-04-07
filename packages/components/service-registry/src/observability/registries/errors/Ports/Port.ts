/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { LoggerInstance } from '@mdf.js/logger';

/**
 * The Port class is responsible for starting and stopping the cluster communication
 * and clearing the actual error registries in the master and worker processes.
 */
export abstract class Port {
  /**
   * Create a new instance of the Port class.
   * @param logger - Logger instance for logging error registration and handling.
   */
  constructor(protected readonly logger: LoggerInstance) {}
  /** Start cluster communication */
  public abstract start(): void;
  /** Stop cluster communication */
  public abstract stop(): void;
  /** Clear all the actual error registries */
  public abstract clear(): void;
}
