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
import { Health, Jobs, Plugs } from '@mdf.js/firehose';
import { Redis } from '@mdf.js/redis-provider';
import { Base } from './Base';

export declare interface Flow {
  /** Emitted when the source suffer some irrecoverable error processing an incoming job */
  on(event: 'error', listener: (error: Crash | Multi) => void): this;
  /** Emitted when there is a new job to be managed */
  on(event: 'data', listener: (job: Jobs.Object) => void): this;
  /** Emitted on every status change */
  on(event: 'status', listener: (status: Health.API.Status) => void): this;
  /** Emitted when the sink is ready to start the consumption */
  on(event: 'ready', listener: () => void): this;
  /** Emitted before a listener is added to its internal array of listeners */
  on(event: 'newListener', listener: (eventName: string) => void): this;
  /** Emitted after the listener is removed. */
  on(event: 'removeListener', listener: (eventName: string) => void): this;
  /** Emitted when a checking process has been performed */
  on(event: 'check', listener: () => void): this;
}

export class Flow extends Base implements Plugs.Source.Flow {
  /** Ready flag */
  #readiness: boolean;
  /** Ingestion state */
  #init: boolean;
  /**
   * Create a new instance of this class
   * @param provider - Redis provider used by this source plug
   * @param streamId - Stream identification from where data will be consumed
   */
  constructor(provider: Redis.Provider, streamId: string) {
    super(provider, streamId);
    this.#init = false;
    this.#readiness = false;
    this.checkRedisReadiness();
    this.checkDataListeners();
  }
  /** Enable consuming process */
  public init(): void {
    this.logger.extend('verbose')(`Init request received`);
    if (this.#init) {
      this.logger.extend('verbose')(`The source was already initialized`);
    } else {
      this.logger.extend('verbose')(`The source has been initialized`);
      this.#init = true;
      if (this.checkIngestReadiness()) {
        this.logger(`Starting the ingestion`);
        this.ingestData();
      }
    }
  }
  /** Stop consuming process */
  public pause(): void {
    this.logger(`Pause request received`);
    this.#init = false;
  }
  /** Check all the conditions for data ingestion */
  private checkIngestReadiness(): boolean {
    const ready = this.listenerCount('data') > 0 && this.#init && this.#readiness;
    this.logger.extend('verbose')(`Checking if the ingestion is ready: ${ready}`);
    return ready;
  }
  /** Check the state of the data listeners */
  private checkDataListeners(): void {
    this.on('newListener', (eventName: string) => {
      if (eventName === 'data') {
        this.logger(`New listener subscribed to data events`);
        this.checkIngestReadiness();
      }
    });
    this.on('removeListener', (eventName: string) => {
      if (eventName === 'data') {
        this.logger(`A listener was unsubscribed to data events`);
        this.checkIngestReadiness();
      }
    });
  }
  /** Check the state of the provider */
  private checkRedisReadiness(): void {
    if (this.provider.state === 'running') {
      this.logger(`Redis is running`);
      this.#readiness = true;
      this.emit('ready');
    } else {
      this.logger(`Redis is NOT running`);
    }
    this.provider.on('status', status => {
      this.logger(`New Redis event`);
      if (status !== 'pass') {
        this.logger(`Redis is not running`);
        this.#readiness = false;
      } else {
        this.#readiness = true;
        this.logger(`Redis is running`);
        this.emit('ready');
      }
      if (this.checkIngestReadiness()) {
        this.logger(`Starting the ingestion`);
        this.ingestData();
      }
    });
  }
  /** Perform the ingestion of new data */
  private ingestData(): void {
    this.repository
      .getJobs(this.streamId, this.streamEntryId)
      .then(jobs => {
        if (!this.checkIngestReadiness()) {
          const crashError = new Crash(
            `The ingested data will not be emitted, the stream is not ready right now`,
            this.provider.componentId
          );
          this.logger(crashError.message);
          this.emit('error', crashError);
        } else {
          this.emit('data', jobs[0]);
          this.streamEntryId = jobs[0].jobId;
        }
      })
      .catch(rawError => {
        const error = Crash.from(rawError, this.provider.componentId);
        this.logger(error.message);
        this.emit('error', error);
        if (this.checkIngestReadiness()) {
          this.ingestData();
        }
      });
  }
}
