/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Registry } from '../modules';
import { CommandJobDone, Control } from '../types';

/** Model class */
export class Model {
  /**
   * Create an instance of model class
   * @param registry - registry instance
   */
  constructor(private readonly registry: Registry) {}
  /** Return array of messages used as fifo registry */
  public messages(): Promise<Control.Message[]> {
    return Promise.resolve(this.registry.messages);
  }
  /** Return array of jobs used as fifo registry */
  public async jobs(): Promise<CommandJobDone[]> {
    return Promise.resolve(this.registry.executedJobs);
  }
  /** Return array of pendingJobs used as fifo registry */
  public async pendingJobs(): Promise<CommandJobDone[]> {
    return Promise.resolve(
      Array.from(this.registry.pendingJobs.values()).map(job => ({
        ...job.result(),
        command: job.data,
      }))
    );
  }
}
