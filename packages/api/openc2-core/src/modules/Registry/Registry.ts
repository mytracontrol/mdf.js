/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health, Jobs } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { EventEmitter } from 'stream';
import { v4 } from 'uuid';
import { Constants } from '../../helpers';
import { CommandJobDone, CommandJobHandler, Control } from '../../types';

export class Registry extends EventEmitter implements Health.Component {
  /** Component identification */
  public readonly componentId: string = v4();
  /** Array of messages used as fifo register */
  public readonly messages: Control.Message[] = [];
  /** Processed jobs */
  public readonly executedJobs: CommandJobDone[] = [];
  /** Pending commands */
  public readonly pendingJobs: Map<string, CommandJobHandler> = new Map();
  /** Uncleaned jobs check internal interval */
  private interval?: NodeJS.Timeout;
  /** Time in milliseconds assigned to check internal */
  private readonly timeInterval: number;
  /** Represent the actual status of the register of jobs */
  private status: Health.Status = 'pass';
  /**
   * Creates a new Register instance
   * @param name - Component name
   * @param maxInactivityTime - Max time in minutes that a job could be pending state
   * @param registerLimit - Maximum number of entries in the message register
   */
  constructor(
    public readonly name: string,
    private readonly maxInactivityTime: number = Constants.DEFAULT_MAX_INACTIVITY_TIME,
    private readonly registerLimit: number = Constants.DEFAULT_MESSAGES_REGISTERS_LIMIT
  ) {
    super();
    this.timeInterval =
      (Math.max(this.maxInactivityTime, Constants.DEFAULT_MIN_INACTIVITY_TIME) * 60 * 1000) / 2;
  }
  /**
   * Add a new job to the registry of the jobs managed by this consumer
   * @param job - job to be added to be added
   */
  public push(job: CommandJobHandler): void;
  /**
   * Add a new message to the registry of the last messages managed by this consumer
   * @param message - message to be added
   */
  public push(message: Control.Message): void;
  public push(item: Control.Message | CommandJobHandler): void {
    if (item instanceof Jobs.JobHandler) {
      this.pendingJobs.set(item.uuid, item);
    } else {
      this.messages.push(item);
      if (this.messages.length > this.registerLimit) {
        this.messages.shift();
      }
    }
    if (!this.interval && this.pendingJobs.size > 0) {
      this.interval = setInterval(this.checkOldPendingJobs, this.timeInterval);
    }
  }
  /** Perform the cleaning of all the resources */
  public clear(): void {
    this.messages.length = 0;
    this.executedJobs.length = 0;
    this.pendingJobs.clear();
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }
  /**
   * Return the job from the register and return it
   * @param uuid - Job uuid
   * @returns
   */
  public delete(uuid: string): CommandJobHandler | undefined {
    const job = this.pendingJobs.get(uuid);
    if (job) {
      this.executedJobs.push({ ...job.result(), command: job.data });
      if (this.executedJobs.length > this.registerLimit) {
        this.executedJobs.shift();
      }
      this.pendingJobs.delete(uuid);
      if (this.pendingJobs.size === 0) {
        clearInterval(this.interval);
        this.interval = undefined;
      }
      return job;
    } else {
      return undefined;
    }
  }
  /**
   * Check if there are pending jobs that have been pending for too long
   */
  private readonly checkOldPendingJobs = (): void => {
    const now = Date.now();
    let newStatus: Health.Status = 'pass';
    for (const [, job] of this.pendingJobs[Symbol.iterator]()) {
      if (now - job.createdAt.getTime() > 1000 * 60 * this.maxInactivityTime) {
        job.done(
          new Crash(
            `Job cancelled after ${this.maxInactivityTime} minutes of inactivity`,
            this.componentId
          )
        );
      } else if (now - job.createdAt.getTime() > (1000 * 60 * this.maxInactivityTime) / 2) {
        newStatus = 'warn';
      }
    }
    if (newStatus !== this.status) {
      this.status = newStatus;
      this.emit('status', this.status);
    }
  };
  /** Return a resume of the pending jobs in the register */
  private resume(): string[] {
    const pendingJobsResume: string[] = [];
    for (const job of this.pendingJobs.values()) {
      for (const target of Object.keys(job.data.content.target)) {
        pendingJobsResume.push(
          `${job.createdAt.toISOString()} - ${job.data.content.action}:${target} - ${job.status}`
        );
      }
    }
    return pendingJobsResume;
  }
  /**
   * Return the status of the stream in a standard format
   * @returns _check object_ as defined in the draft standard
   * https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check-05
   */
  public get checks(): Health.Checks {
    const check: Health.Check = {
      status: this.status,
      componentId: this.componentId,
      componentType: 'source',
      observedValue: this.pendingJobs.size,
      observedUnit: 'pending commands',
      time: new Date().toISOString(),
      output: this.status !== 'pass' ? this.resume() : undefined,
    };
    return {
      [`${this.name}:commands`]: [check],
    };
  }
}
