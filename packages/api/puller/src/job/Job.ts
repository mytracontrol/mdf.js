/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Bottleneck } from '../bottleneck/Bottleneck';
import { BottleneckError } from '../bottleneckError/BottleneckError';
import { Events } from '../events/Events';
import { load } from '../parser/Parser';
import { States } from '../states/States';
import { DEFAULT_PRIORITY, NUM_PRIORITIES } from './Job.constants';
import { DropOptions, JobEventInfo, JobOptions, JobOptionsComplete } from './Job.interfaces';

export class Job {
  private _task: any;
  private _args: any;
  private _rejectOnDrop: boolean;
  private _events: Events;
  private _states: States;
  private _options: JobOptionsComplete;
  private _retryCount: number;

  public promise: any;
  public resolve: any;
  public reject: any;

  constructor(
    task: any,
    args: any,
    options: JobOptions,
    jobDefaults: JobOptionsComplete,
    rejectOnDrop: boolean,
    events: Events,
    states: States
  ) {
    this._task = task;
    this._args = args;
    this._rejectOnDrop = rejectOnDrop;
    this._events = events;
    this._states = states;
    this._options = load(options, jobDefaults) as JobOptionsComplete;
    this._options.priority = this._sanitizePriority(this._options.priority);

    if (this._options.id === jobDefaults.id) {
      this._options.id = `${this._options.id}-${this._randomIndex()}`;
    }

    this.promise = new Promise<any>((_resolve: any, _reject: any) => {
      this.resolve = _resolve;
      this.reject = _reject;
    });

    this._retryCount = 0;
  }

  private _sanitizePriority(priority: number): number {
    const sProperty = ~~priority !== priority ? DEFAULT_PRIORITY : priority;

    if (sProperty < 0) {
      return 0;
    } else if (sProperty > NUM_PRIORITIES - 1) {
      return NUM_PRIORITIES - 1;
    } else {
      return sProperty;
    }
  }

  private _randomIndex(): string {
    return Math.random().toString(36).slice(2);
  }

  public doDrop(options: DropOptions = {}): boolean {
    const message = options.message ?? 'This job has been dropped by Bottleneck';
    if (this._states.remove(this._options.id)) {
      if (this._rejectOnDrop) {
        this.reject(options.error ?? new BottleneckError(message));
      }

      this._events.trigger('dropped', {
        args: this._args,
        options: this._options,
        task: this._task,
        promise: this.promise,
      });
      return true;
    } else {
      return false;
    }
  }

  private _assertStatus(expected: string): void {
    const status = this._states.jobStatus(this._options.id);

    if (!(status === expected || (expected === 'DONE' && status === null))) {
      throw new BottleneckError(
        `Invalid job status ${status}, expected ${expected}. ` +
          `Please open an issue at https://github.com/SGrondin/bottleneck/issues`
      );
    }
  }

  public doReceive(): void {
    this._states.start(this._options.id);
    this._events.trigger('received', {
      args: this._args,
      options: this._options,
    });
  }

  public doQueue(reachedHWM: boolean, blocked: boolean): void {
    this._assertStatus('RECEIVED');
    this._states.next(this._options.id);
    this._events.trigger('queued', {
      args: this._args,
      options: this._options,
      reachedHWM,
      blocked,
    });
  }

  public doRun(): void {
    if (this._retryCount === 0) {
      this._assertStatus('QUEUED');
      this._states.next(this._options.id);
    } else {
      this._assertStatus('EXECUTING');
    }

    this._events.trigger('scheduled', {
      args: this._args,
      options: this._options,
    });
  }

  public async doExecute(
    chained: Bottleneck | null,
    clearGlobalState: () => boolean,
    run: (...args: any[]) => any,
    free: (jobOptions: JobOptionsComplete, eventInfo: JobEventInfo) => Promise<void>
  ): Promise<any> {
    let passed: any;

    if (this._retryCount === 0) {
      this._assertStatus('RUNNING');
      this._states.next(this._options.id);
    } else {
      this._assertStatus('EXECUTING');
    }

    const eventInfo: JobEventInfo = {
      args: this._args,
      options: this._options,
      retryCount: this._retryCount,
    };
    this._events.trigger('executing', eventInfo);

    try {
      passed = await (chained != null
        ? chained.schedule(this._options, this._task, ...this._args)
        : this._task(...this._args));

      if (clearGlobalState()) {
        this.doDone(eventInfo);
        await free(this._options, eventInfo);
        this._assertStatus('DONE');
        return this.resolve(passed);
      }
    } catch (error) {
      return this._onFailure(error, eventInfo, clearGlobalState, run, free);
    }
  }

  public async doExpire(
    clearGlobalState: () => boolean,
    run: (...args: any[]) => any,
    free: (jobOptions: JobOptionsComplete, eventInfo: JobEventInfo) => Promise<void>
  ): Promise<void> {
    if (this._states.jobStatus(this._options.id) === 'RUNNING') {
      this._states.next(this._options.id);
    }

    this._assertStatus('EXECUTING');

    const eventInfo: JobEventInfo = {
      args: this._args,
      options: this._options,
      retryCount: this._retryCount,
    };
    const error = new BottleneckError(`This job timed out after ${this._options.expiration} ms.`);
    return this._onFailure(error, eventInfo, clearGlobalState, run, free);
  }

  private async _onFailure(
    error: any,
    eventInfo: JobEventInfo,
    clearGlobalState: () => boolean,
    run: (...args: any[]) => Promise<any>, //void?
    free: (jobOptions: JobOptionsComplete, eventInfo: JobEventInfo) => Promise<void>
  ): Promise<void> {
    let retry: number;
    let retryAfter: number;

    if (clearGlobalState()) {
      retry = await this._events.trigger('failed', error, eventInfo);

      if (retry != null) {
        retryAfter = ~~retry;

        this._events.trigger(
          'retry',
          `Retrying ${this._options.id} after ${retryAfter} ms`,
          eventInfo
        );

        this._retryCount++;
        return run(retryAfter);
      } else {
        this.doDone(eventInfo);

        await free(this._options, eventInfo);

        this._assertStatus('DONE');

        return this.reject(error);
      }
    }
  }

  private doDone(eventInfo: any): Promise<void> {
    this._assertStatus('EXECUTING');
    this._states.next(this.options.id);
    return this._events.trigger('done', eventInfo);
  }

  // ------------------ GETTERS ------------------
  public get options(): JobOptionsComplete {
    return this._options;
  }

  public get args(): any[] {
    return this._args;
  }
}
