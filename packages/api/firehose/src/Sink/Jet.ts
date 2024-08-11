/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { OpenJobHandler, Plugs, SinkOptions } from '../types';
import { Base } from './core';

export class Jet extends Base<Plugs.Sink.Jet> {
  /**
   * Create a new Jet instance
   * @param plug - Jet sink plug
   * @param options - sink options
   */
  constructor(plug: Plugs.Sink.Jet, options?: SinkOptions) {
    super(plug, options);
  }
  /** Perform the publication of the information on the sink destination */
  override _write(
    data: OpenJobHandler,
    encoding: string,
    callback: (error?: Crash | Error) => void
  ): void {
    // Stryker disable next-line all
    this.logger.verbose(`Publishing job ${data.jobUserId} on single operation from Jet Sink`);
    this.plug
      .single(data.toObject())
      .then(() => data.done())
      .catch(error => data.done(error))
      .finally(() => callback());
  }
  /** Perform the publication of the information on the sink destination */
  override _writev?(
    data: {
      chunk: OpenJobHandler;
      encoding: BufferEncoding;
    }[],
    callback: (error?: Crash | Error) => void
  ): void {
    // Stryker disable next-line all
    this.logger.verbose(`Publishing ${data.length} jobs on bulk operation`);
    this.plug
      .multi(data.map(entry => entry.chunk.toObject()))
      .then(() => {
        for (const entry of data) {
          // Stryker disable next-line all
          this.logger.verbose(`Job ${entry.chunk.jobUserId} finished`);
          entry.chunk.done();
        }
      })
      .catch(error => {
        for (const entry of data) {
          entry.chunk.done(error);
        }
      })
      .finally(() => callback());
  }
}
