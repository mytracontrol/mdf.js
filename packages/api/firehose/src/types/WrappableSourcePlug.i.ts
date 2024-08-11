/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Layer } from '@mdf.js/core';
import { EventEmitter } from 'events';
import { Registry } from 'prom-client';
import { OpenJobRequest } from './OpenJobs.t';

export interface WrappableSourcePlug extends EventEmitter, Layer.App.Resource {
  on(event: 'error' | 'data' | 'status', listener: (...args: any[]) => void): this;
  /**
   * Perform the task to clean the job registers after the job has been resolved
   * @param jobId - Job entry identification
   * @returns - the job entry identification that has been correctly removed or undefined if the job
   * was not found
   */
  postConsume: (jobId: string) => Promise<string | undefined>;
  /**
   * Perform the ingestion of new jobs
   * @param size - Number of jobs to be ingested
   */
  ingestData?: (size: number) => Promise<OpenJobRequest | OpenJobRequest[]>;
  /**
   * Add new credits to the source
   * @param credits - Credits to be added to the source
   */
  addCredits?: (credits: number) => Promise<void>;
  /** Enable consuming process */
  init?: () => void;
  /** Stop consuming process */
  pause?: () => void;
  /** Start the Plug and the underlayer resources, making it available */
  start: () => Promise<void>;
  /** Stop the Plug and the underlayer resources, making it unavailable */
  stop: () => Promise<void>;
  /** Metrics registry for this component */
  readonly metrics?: Registry;
}
