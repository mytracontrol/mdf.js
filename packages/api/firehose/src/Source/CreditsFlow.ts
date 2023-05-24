/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Jobs } from '@mdf.js/core';
import { Plugs, SourceOptions } from '../types';
import { Base } from './core';

export class CreditsFlow<
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, any> = Record<string, any>
> extends Base<Plugs.Source.CreditsFlow<Type, Data, CustomHeaders>, Type, Data, CustomHeaders> {
  /**
   * Create a new instance for the firehose source
   * @param plug - Sequence source plug
   * @param options - source options
   */
  constructor(plug: Plugs.Source.CreditsFlow<Type, Data, CustomHeaders>, options?: SourceOptions) {
    super(plug, options);
    this.plug.on('data', this._onJobReceived);
  }
  /** Perform the read of data from the source */
  _read(size: number): void {
    this.plug.addCredits(size).then(() => {
      // Stryker disable next-line all
      this.logger.verbose(`${size} credits has been added`);
    });
  }
  /**
   * Process the received jobs
   * @param job - job to be processed
   */
  private readonly _onJobReceived = (job: Jobs.JobRequest<Type, Data, CustomHeaders>) => {
    // Stryker disable next-line all
    this.logger.verbose(`New job from consumer: ${job.jobUserId}`);
    this.push(
      this.subscribeJob(
        new Jobs.JobHandler<Type, Data, CustomHeaders>({
          data: job.data,
          type: job.type,
          jobUserId: job.jobUserId,
          options: {
            headers: job.options?.headers,
            numberOfHandlers: this.numberOfHandlers,
          },
        })
      )
    );
  };
}
