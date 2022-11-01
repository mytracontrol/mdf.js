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
