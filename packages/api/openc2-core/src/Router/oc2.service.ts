/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Jobs } from '@mdf.js/core';
import { Control } from '../types';
import { Model } from './oc2.model';

/** Service class */
export class Service {
  /**
   * Create an instance of service
   * @param model - model instance
   */
  constructor(private readonly model: Model) {}
  /** Return array of messages used as fifo registry */
  public async messages(): Promise<Control.Message[]> {
    return this.model.messages();
  }
  /** Return array of jobs used as fifo registry */
  public async jobs(): Promise<Jobs.Result<'command'>[]> {
    return this.model.jobs();
  }
  /** Return array of pendingJobs used as fifo registry */
  public async pendingJobs(): Promise<Jobs.Result<'command'>[]> {
    return this.model.pendingJobs();
  }
}
