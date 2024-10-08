/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health, Jobs, Layer } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { Registry } from 'prom-client';

export interface Base<
  Type extends string = string,
  Data = any,
  CustomHeaders extends Record<string, any> = Jobs.NoMoreHeaders,
  CustomOptions extends Record<string, any> = Jobs.NoMoreOptions,
> extends Layer.App.Resource {
  /** Emitted when the component throw an error */
  on(event: 'error', listener: (error: Crash | Error) => void): this;
  /** Emitted on every status change */
  on(event: 'status', listener: (status: Health.Status) => void): this;
  /**
   * Perform the processing of a single Job
   * @param job - job to be processed
   */
  single: (job: Jobs.JobObject<Type, Data, CustomHeaders, CustomOptions>) => Promise<void>;
  /** Start the Plug and the underlayer resources, making it available */
  start(): Promise<void>;
  /** Stop the Plug and the underlayer resources, making it unavailable */
  stop(): Promise<void>;
  /** Metrics registry for this component */
  readonly metrics?: Registry;
}
