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
