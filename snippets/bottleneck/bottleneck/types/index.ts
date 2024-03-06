/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';

/** Bottleneck events */
export enum EVENTS {
  ERROR = 'error',
  EMPTY = 'empty',
  IDLE = 'idle',
  DEPLETED = 'depleted',
  MESSAGE = 'message',
  DEBUG = 'debug',
  DROPPED = 'dropped',
  RECEIVED = 'received',
  QUEUED = 'queued',
  SCHEDULED = 'scheduled',
  EXECUTING = 'executing',
  DONE = 'done',
  RETRY = 'retry',
  FAILED = 'failed',
}

/** Job state type */
export enum JOB_STATUS {
  RECEIVED = 'RECEIVED',
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  EXECUTING = 'EXECUTING',
  DONE = 'DONE',
}
/** Job state type */
export type JobState = keyof typeof JOB_STATUS;
/* Default states names for jobs */
export const DEFAULT_STATES_NAMES: JobState[] = [
  JOB_STATUS.RECEIVED,
  JOB_STATUS.QUEUED,
  JOB_STATUS.RUNNING,
  JOB_STATUS.EXECUTING,
];

/** Options for the Batcher */
export interface BatcherOptions {
  /** The maximum time in milliseconds to wait before flushing the batch */
  maxTime?: number;
  /** The maximum number of items to batch before flushing */
  maxSize?: number;
}

/** Event info */
export interface EventInfo {
  /** Task arguments */
  readonly args: TaskArguments;
  /** Task options */
  readonly options: Required<JobOptions>;
}

/** Event info queued */
export interface EventInfoQueued extends EventInfo {
  /* Flag indicating whether the the queue high-water mark was reached */
  readonly reachedHWM: boolean;
  /** Flag indicating whether the queue is blocked */
  readonly blocked: boolean;
}

/** Event info retryable */
export interface EventInfoRetryable extends EventInfo {
  /** Number of times the job has been retried */
  readonly retryCount: number;
}

/** Event info dropped */
export interface EventInfoDropped extends EventInfo {
  /** Task function */
  readonly task: TaskAsPromise<any>;
  /** Promise to resolve when the job is dropped */
  readonly promise: Promise<any>;
}

/** Stop options */
export interface StopOptions {
  /**
   * When `true`, drop all the RECEIVED, QUEUED and RUNNING jobs. When `false`, allow those jobs to
   * complete before resolving the Promise returned by this method.
   */
  readonly dropWaitingJobs?: boolean;
  /** The error message used to drop jobs when `dropWaitingJobs` is `true` */
  readonly dropErrorMessage?: string;
  /** The error message used to reject a job added to the limiter after `stop()` has been called */
  readonly enqueueErrorMessage?: string;
}
/** Job options */
export interface JobOptions {
  /**
   * A priority between `0` and `9`. A job with a priority of `4` will _always_ be executed before
   * a job with a priority of `5`.
   */
  priority?: number;
  /**
   * Must be an integer equal to or higher than `0`. The `weight` is what increases the number of
   * running jobs (up to `maxConcurrent`, if using) and decreases the `reservoir` value (if using).
   */
  weight?: number;
  /**
   * The number milliseconds a job has to finish. Jobs that take longer than their `expiration`
   * will be failed with a `BottleneckError`.
   */
  expiration?: number | null;
  /** Optional identifier, helps with debug output */
  id?: string;
}
/** Drop options */
export interface DropOptions {
  /** The error to reject the job promise with */
  error?: Error | Crash;
  /** The message to reject the job promise with */
  message?: string;
}

/* Default priority for jobs*/
export const DEFAULT_PRIORITY = 5;
/* Number of queues for jobs */
export const NUMBER_OF_QUEUES = 10;
/* Maximum priority for jobs */
export const MAX_PRIORITY = NUMBER_OF_QUEUES - 1;
/* Default id for jobs */
export const DEFAULT_ID = '<no-id>';
/* Default options for jobs */
export const DEFAULT_JOB_OPTIONS: Required<JobOptions> = {
  priority: DEFAULT_PRIORITY,
  weight: 1,
  expiration: null,
  id: DEFAULT_ID,
};
/** Task arguments */
export type TaskArguments = any[];
/** Task callback */
export type TaskCallback<R> = (error: Error | Crash | null, result?: R) => void;

/** Task as callback */
export type TaskAsCallback<R> = (...args: [...TaskArguments, TaskCallback<R>]) => void;
/** Task as promise */
export type TaskAsPromise<R> = (...args: TaskArguments) => Promise<R>;
