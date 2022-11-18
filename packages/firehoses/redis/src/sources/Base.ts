/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Netin System S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Netin System S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Netin System S.L.
 */

import { Crash, Multi } from '@mdf.js/crash';
import { Health, Jobs } from '@mdf.js/firehose';
import { Redis } from '@mdf.js/redis-provider';
import Debug from 'debug';
import EventEmitter from 'events';
import { SourceRepository } from '../Repositories';

export declare interface Base {
  /** Emitted when the source suffer some irrecoverable error processing an incoming job */
  on(event: 'error', listener: (error: Crash | Multi) => void): this;
  /** Emitted when there is a new job to be managed */
  on(event: 'data', listener: (job: Jobs.JobObject) => void): this;
  /** Emitted on every status change */
  on(event: 'status', listener: (status: Health.API.Status) => void): this;
}

export abstract class Base extends EventEmitter {
  /** Debug logger for development and deep troubleshooting */
  protected readonly logger: Debug.Debugger;
  /** Repository used by this source */
  protected readonly repository: SourceRepository;
  /** Actual stream entry identification */
  protected streamEntryId = '0';
  /**
   * Create a new instance of this class
   * @param provider - Redis provider used by this source plug
   * @param streamId - Stream identification from where data will be consumed
   */
  constructor(protected readonly provider: Redis.Provider, protected readonly streamId: string) {
    super();
    this.logger = Debug(`coupling:redis:source`);
    this.repository = new SourceRepository(provider);
  }
  /** Provider unique identifier for trace purposes */
  public get componentId(): string {
    return this.provider.componentId;
  }
  /** Source name */
  public get name(): string {
    return this.provider.name;
  }
  /**
   * Return the status of the connection in a standard format
   * @returns _check object_ as defined in the draft standard
   * https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check-05
   */
  public get checks(): Health.API.Checks {
    return this.provider.checks;
  }
  /**
   * Perform the task to clean the data from the stream
   *
   * !!NOTE: Redis will not clean the entry in the moment, only complete groups are deleted, so it
   * can wait to clean the entry and inform you (resolve the promise) later
   * @param jobId - job to be delete
   * @returns
   */
  public postConsume(jobId: string): Promise<string | undefined> {
    return this.repository.deleteJob(this.streamId, jobId);
  }
}
