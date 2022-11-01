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

import { Health, JobHandler } from '@mdf.js/core';
import { Plugs, SourceOptions } from '../types';
import { Base } from './core';

export class Sequence extends Base<Plugs.Source.Sequence> {
  /** Indication of pending data request flag */
  private pendingRequest = false;
  /** Actual window size */
  private actualWindowSize = 0;
  /** Requested window size */
  private requestedWindowSize = 0;
  /**
   * Create a new instance for the firehose source
   * @param plug - Sequence source plug
   * @param options - source options
   */
  constructor(plug: Plugs.Source.Sequence, options?: SourceOptions) {
    super(plug, options);
  }
  /** Perform the read of data from the source */
  _read(size: number): void {
    if (this.pendingRequest) {
      // Stryker disable next-line all
      this.logger.extend('verbose')(`New ingestion request received when there is pending request`);
      return;
    }
    this.pendingRequest = true;
    this.requestedWindowSize = size;
    this.actualWindowSize = 0;
    this.plug.on('data', this._onJobReceived);
    // The wrapped ensure that this ingest is always retried in order to ensure the correct
    // operation of the firehose
    this.plug.ingestData(size).then(result => {
      // Stryker disable all
      this.logger.extend('verbose')(
        `The request has been resolved, more request should be accepted`
      );
      // Stryker restore all
      this.processJobs(result);
      this.pendingRequest = false;
      this.plug.off('data', this._onJobReceived);
    });
  }
  /**
   * Return the status of the stream in a standard format
   * @returns _check object_ as defined in the draft standard
   * https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check-05
   */
  override get checks(): Health.API.Checks {
    return {
      ...super.checks,
      [`${this.name}:window`]: [
        {
          status: this.windowStatus,
          componentId: this.componentId,
          componentType: 'stream',
          observedValue: `${this.actualWindowSize}/${this.requestedWindowSize}`,
          observedUnit: 'pending windows jobs',
          time: new Date().toISOString(),
          output:
            this.windowStatus === 'pass'
              ? undefined
              : 'All the requested jobs has been ingested, but no new request has been received',
        },
      ],
    };
  }
  /** Check the status of the requested window */
  private get windowStatus(): Health.API.Status {
    return this.actualWindowSize < this.requestedWindowSize ? 'pass' : 'warn';
  }
  /**
   * Push the received jobs to the stream
   * @param jobs - jobs to be pushed to the stream
   */
  private processJobs(jobs: Plugs.Source.JobObject | Plugs.Source.JobObject[]): void {
    const arrayOfJobs = Array.isArray(jobs) ? jobs : [jobs];
    this.actualWindowSize += arrayOfJobs.length;
    for (const job of arrayOfJobs) {
      this.push(
        this.subscribeJob(
          new JobHandler(job.data, job.jobId, job.type, { headers: job.headers, qos: this.qos })
        )
      );
    }
    // Stryker disable all
    this.logger.extend('verbose')(
      `${this.actualWindowSize}/${this.requestedWindowSize} jobs processed`
    );
    // Stryker restore all
  }
  /**
   * Process the received jobs
   * @param job - job to be processed
   */
  private _onJobReceived = (job: Plugs.Source.JobObject) => {
    this.actualWindowSize++;
    // Stryker disable next-line all
    this.logger.extend('verbose')(`New job from consumer: ${job.jobId}`);
    if (
      !this.push(
        this.subscribeJob(
          new JobHandler(job.data, job.jobId, job.type, { headers: job.headers, qos: this.qos })
        )
      )
    ) {
      // Stryker disable next-line all
      this.logger.extend('verbose')(`No more job could be processed right now`);
    }
    // Stryker disable all
    this.logger.extend('verbose')(
      `${this.actualWindowSize}/${this.requestedWindowSize} jobs processed`
    );
    // Stryker restore all
  };
}
