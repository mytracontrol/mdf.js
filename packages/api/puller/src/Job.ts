/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { BottleneckError } from './BottleneckError';
import { Events } from './Events';
import { DropOptions } from './Job.interfaces';
import { States } from './States';
import { load } from './parser';

const NUM_PRIORITIES = 10;
const DEFAULT_PRIORITY = 5;

export class Job {
  private task: any;
  private args: any;
  private rejectOnDrop: boolean;
  private events: Events;
  private states: States;
  private Promise: any;
  private promise: any;
  private _resolve: any;
  private _reject: any;
  private options: Record<string, any>;
  private retryCount: number;

  constructor(
    task: any,
    args: any,
    options: Record<string, any>,
    jobDefaults: any,
    rejectOnDrop: boolean,
    events: Events,
    states: States,
    Promise: any
  ) {
    this.task = task;
    this.args = args;
    this.rejectOnDrop = rejectOnDrop;
    this.events = events;
    this.states = states;
    this.Promise = Promise;
    this.options = load(options, jobDefaults);
    this.options['priority'] = this._sanitizePriority(this.options['priority']);

    if (this.options['id'] === jobDefaults['id']) {
      this.options['id'] = `${this.options['id']}-${this._randomIndex()}`;
    }

    this.promise = new this.Promise((_resolve: any, _reject: any) => {
      this._resolve = _resolve;
      this._reject = _reject;
    });

    this.retryCount = 0;
  }

  _sanitizePriority(priority: number): number {
    const sProperty = ~~priority !== priority ? DEFAULT_PRIORITY : priority;

    if (sProperty < 0) {
      return 0;
    } else if (sProperty > NUM_PRIORITIES - 1) {
      return NUM_PRIORITIES - 1;
    } else {
      return sProperty;
    }
  }

  _randomIndex(): string {
    return Math.random().toString(36).slice(2);
  }

  doDrop(options: DropOptions = {}): boolean {
    const { error, message = 'This job has been dropped by Bottleneck' } = options;
    if (this.states.remove(this.options['id'])) {
      if (this.rejectOnDrop) {
        this._reject(error ?? new BottleneckError(message));
      }

      this.events.trigger('dropped', {
        args: this.args,
        options: this.options,
        task: this.task,
        promise: this.promise,
      });
      return true;
    } else {
      return false;
    }
  }

  _assertStatus(expected: string): void {
    const status = this.states.jobStatus(this.options['id']);

    if (!(status === expected || (expected === 'DONE' && status === null))) {
      throw new BottleneckError(
        `Invalid job status ${status}, expected ${expected}. ` +
          `Please open an issue at https://github.com/SGrondin/bottleneck/issues`
      );
    }
  }

  doReceive(): void {
    this.states.start(this.options['id']);
    this.events.trigger('received', {
      args: this.args,
      options: this.options,
    });
  }

  doQueue(reachedHWM: boolean, blocked: boolean): void {
    this._assertStatus('RECEIVED');
    this.states.next(this.options['id']);
    this.events.trigger('queued', {
      args: this.args,
      options: this.options,
      reachedHWM,
      blocked,
    });
  }

  doRun(): void {
    if (this.retryCount === 0) {
      this._assertStatus('QUEUED');
      this.states.next(this.options['id']);
    } else {
      this._assertStatus('EXECUTING');
    }

    this.events.trigger('scheduled', {
      args: this.args,
      options: this.options,
    });
  }

  async doExecute(chained: any, clearGlobalState: any, run: any, free: any): Promise<void> {
    let passed: any;

    if (this.retryCount === 0) {
      this._assertStatus('RUNNING');
      this.states.next(this.options['id']);
    } else {
      this._assertStatus('EXECUTING');
    }

    const eventInfo = {
      args: this.args,
      options: this.options,
      retryCount: this.retryCount,
    };
    this.events.trigger('executing', eventInfo);

    try {
      passed =
        chained != null
          ? chained.schedule(this.options, this.task, ...this.args)
          : this.task(...this.args);

      if (clearGlobalState()) {
        this.doDone(eventInfo);
        await free(this.options, eventInfo);
        this._assertStatus('DONE');
        return this._resolve(passed);
      }
    } catch (error) {
      return this._onFailure(error, eventInfo, clearGlobalState, run, free);
    }
  }

  async doExpire(clearGlobalState: any, run: any, free: any): Promise<void> {
    if (this.states.jobStatus(this.options['id']) === 'RUNNING') {
      this.states.next(this.options['id']);
    }

    this._assertStatus('EXECUTING');

    const eventInfo = {
      args: this.args,
      options: this.options,
      retryCount: this.retryCount,
    };
    const error = new BottleneckError(`This job timed out after ${this.options['expiration']} ms.`);
    return this._onFailure(error, eventInfo, clearGlobalState, run, free);
  }

  async _onFailure(
    error: any,
    eventInfo: any,
    clearGlobalState: any,
    run: any,
    free: any
  ): Promise<void> {
    let retry: number;
    let retryAfter: number;

    if (clearGlobalState()) {
      retry = await this.events.trigger('failed', error, eventInfo);

      if (retry != null) {
        retryAfter = ~~retry;

        this.events.trigger(
          'retry',
          `Retrying ${this.options['id']} after ${retryAfter} ms`,
          eventInfo
        );

        this.retryCount++;
        return run(retryAfter);
      } else {
        this.doDone(eventInfo);

        await free(this.options, eventInfo);

        this._assertStatus('DONE');

        return this._reject(error);
      }
    }
    // TODO: Check
    return Promise.resolve();
  }

  doDone(eventInfo: any): Promise<void> {
    this._assertStatus('EXECUTING');
    this.states.next(this.options['id']);
    return this.events.trigger('done', eventInfo);
  }
}
