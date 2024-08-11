/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { OpenJobHandler, Plugs, SinkOptions } from '../types';
import { Base } from './core';

export class Tap extends Base<Plugs.Sink.Tap> {
  /**
   * Create a new Tap instance
   * @param plug - Tap sink plug
   * @param options - sink options
   */
  constructor(plug: Plugs.Sink.Tap, options?: SinkOptions) {
    super(plug, options);
  }
  /** Perform the publication of the information on the sink destination */
  override _write(
    data: OpenJobHandler,
    encoding: string,
    callback: (error?: Crash | Error) => void
  ): void {
    // Stryker disable next-line all
    this.logger.verbose(`Publishing job ${data.jobUserId} on single operation from Tab Sink`);
    this.plug
      .single(data.toObject())
      .then(() => data.done())
      .catch(error => data.done(error))
      .finally(() => callback());
  }
}
