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
import { Crash } from '@mdf/crash';
import { RetryOptions } from '@mdf/utils';
import { WritableOptions } from 'stream';
import { Plugs } from '../types';
import { Base } from './core';

export class Jet extends Base<Plugs.Sink.Jet> {
  /**
   * Create a new Jet instance
   * @param plug - Jet sink plug
   * @param retryOptions - options for job retry operations
   * @param options - writable streams options
   */
  constructor(plug: Plugs.Sink.Jet, retryOptions?: RetryOptions, options?: WritableOptions) {
    super(plug, retryOptions, options);
  }
  /** Perform the publication of the information on the sink destination */
  override _write(
    data: JobHandler<any>,
    encoding: string,
    callback: (error?: Crash | Error) => void
  ): void {
    // Stryker disable next-line all
    this.logger.extend('verbose')(`Publishing job ${data.jobId} on single operation`);
    this.plug
      .single(data.toObject())
      .then(() => data.done())
      .catch(error => data.done(error))
      .finally(() => callback());
  }
  /** Perform the publication of the information on the sink destination */
  override _writev?(
    data: { chunk: JobHandler<any>; encoding: BufferEncoding }[],
    callback: (error?: Crash | Error) => void
  ): void {
    // Stryker disable next-line all
    this.logger.extend('verbose')(`Publishing ${data.length} jobs on bulk operation`);
    this.plug
      .multi(data.map(entry => entry.chunk.toObject()))
      .then(() => {
        for (const entry of data) {
          // Stryker disable next-line all
          this.logger.extend('verbose')(`Job ${entry.chunk.jobId} finished`);
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
