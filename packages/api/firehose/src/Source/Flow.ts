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

import { JobHandler } from '@mdf/core';
import { Plugs, SourceOptions } from '../types';
import { Base } from './core';

export class Flow extends Base<Plugs.Source.Flow> {
  /**
   * Create a new instance for the firehose source
   * @param plug - Flow source plug
   * @param options - source options
   */
  constructor(plug: Plugs.Source.Flow, options?: SourceOptions) {
    super(plug, options);
    this.plug.on('data', this._onJobReceived);
  }
  /** Perform the read of data from the source */
  _read(size: number): void {
    this.plug.init();
  }
  /**
   * Process the received jobs
   * @param job - job to be processed
   */
  private _onJobReceived = (job: Plugs.Source.JobObject) => {
    // Stryker disable next-line all
    this.logger.extend('verbose')(`New job from consumer: ${job.jobId}`);
    if (
      !this.push(
        this.subscribeJob(
          new JobHandler(job.data, job.jobId, job.type, { headers: job.headers, qos: this.qos })
        )
      )
    ) {
      // Stryker disable next-line all
      this.logger.extend('verbose')(`No more job could be processed right now`);
      this.plug.pause();
    }
  };
}
