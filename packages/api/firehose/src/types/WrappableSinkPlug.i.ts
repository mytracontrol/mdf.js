/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Layer } from '@mdf.js/core';
import { Registry } from 'prom-client';
import { OpenJobObject } from './OpenJobs.t';

export interface WrappableSinkPlug extends Layer.App.Resource {
  /**
   * Perform the processing of a single Job
   * @param job - job to be processed
   */
  single: (job: OpenJobObject) => Promise<void>;
  /**
   * Perform the processing of several Jobs
   * @param jobs - jobs to be processed
   */
  multi?: (jobs: OpenJobObject[]) => Promise<void>;
  /** Start the Plug and the underlayer resources, making it available */
  start(): Promise<void>;
  /** Stop the Plug and the underlayer resources, making it unavailable */
  stop(): Promise<void>;
  /** Metrics registry for this component */
  readonly metrics?: Registry;
}
