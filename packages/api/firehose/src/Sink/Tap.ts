/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { JobHandler } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { RetryOptions } from '@mdf.js/utils';
import { WritableOptions } from 'stream';
import { Plugs } from '../types';
import { Base } from './core';

export class Tap extends Base<Plugs.Sink.Tap> {
  /**
   * Create a new Tap instance
   * @param plug - Tap sink plug
   * @param retryOptions - options for job retry operations
   * @param options - writable streams options
   */
  constructor(plug: Plugs.Sink.Tap, retryOptions?: RetryOptions, options?: WritableOptions) {
    super(plug, retryOptions, options);
  }
  /** Perform the publication of the information on the sink destination */
  override _write(
    data: JobHandler<any>,
    encoding: string,
    callback: (error?: Crash | Error) => void
  ): void {
    // Stryker disable next-line all
    this.logger.extend('verbose')(`Publishing job ${data.jobId} on single operation from Tab Sink`);
    this.plug
      .single(data.toObject())
      .then(() => data.done())
      .catch(error => data.done(error))
      .finally(() => callback());
  }
}
