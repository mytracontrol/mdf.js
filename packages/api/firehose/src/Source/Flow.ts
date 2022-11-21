/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Jobs } from '@mdf.js/core';
import { Plugs, SourceOptions } from '../types';
import { Base } from './core';

export class Flow<
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, any> = Record<string, any>
> extends Base<Plugs.Source.Flow<Type, Data, CustomHeaders>, Type, Data, CustomHeaders> {
  /**
   * Create a new instance for the firehose source
   * @param plug - Flow source plug
   * @param options - source options
   */
  constructor(plug: Plugs.Source.Flow<Type, Data, CustomHeaders>, options?: SourceOptions) {
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
  private readonly _onJobReceived = (job: Plugs.Source.JobObject<Type, Data, CustomHeaders>) => {
    // Stryker disable next-line all
    this.logger.verbose(`New job from consumer: ${job.jobId}`);
    if (
      !this.push(
        this.subscribeJob(
          new Jobs.JobHandler<Type, Data, CustomHeaders>(job.data, job.jobId, job.type, {
            headers: job.headers,
            qos: this.qos,
          })
        )
      )
    ) {
      // Stryker disable next-line all
      this.logger.verbose(`No more job could be processed right now`);
      this.plug.pause();
    }
  };
}
