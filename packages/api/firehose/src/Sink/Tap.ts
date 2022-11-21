/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Jobs } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { Plugs, SinkOptions } from '../types';
import { Base } from './core';

export class Tap<
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, any> = Record<string, any>
> extends Base<Plugs.Sink.Tap<Type, Data, CustomHeaders>, Type, Data, CustomHeaders> {
  /**
   * Create a new Tap instance
   * @param plug - Tap sink plug
   * @param options - sink options
   */
  constructor(plug: Plugs.Sink.Tap<Type, Data>, options?: SinkOptions) {
    super(plug, options);
  }
  /** Perform the publication of the information on the sink destination */
  override _write(
    data: Jobs.JobHandler<Type, Data, CustomHeaders>,
    encoding: string,
    callback: (error?: Crash | Error) => void
  ): void {
    // Stryker disable next-line all
    this.logger.verbose(`Publishing job ${data.jobId} on single operation from Tab Sink`);
    this.plug
      .single(data.toObject())
      .then(() => data.done())
      .catch(error => data.done(error))
      .finally(() => callback());
  }
}
