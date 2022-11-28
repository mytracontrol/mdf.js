/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health, Jobs } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';

export interface Base<
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, any> = Record<string, any>
> extends Health.Component {
  /** Emitted when the component throw an error */
  on(event: 'error', listener: (error: Crash | Error) => void): this;
  /**
   * Emitted when the component throw an fatal error, this will trigger the restart of the firehose
   * instance
   */
  on(event: 'fatal', listener: (error: Crash | Error) => void): this;
  /** Emitted on every status change */
  on(event: 'status', listener: (status: Health.API.Status) => void): this;
  /**
   * Perform the processing of a single Job
   * @param job - job to be processed
   */
  single: (job: Jobs.JobObject<Type, Data, CustomHeaders>) => Promise<void>;
  /** Start the Plug and the underlayer resources, making it available */
  start(): Promise<void>;
  /** Stop the Plug and the underlayer resources, making it unavailable */
  stop(): Promise<void>;
}
