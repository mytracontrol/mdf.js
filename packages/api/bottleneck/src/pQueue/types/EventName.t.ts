/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Job queue events */
export enum EVENT_NAME {
  /** Emitted as each item is processed in the queue for the purpose of tracking progress. */
  ACTIVE = 'active',
  /**
   * Emitted every time the queue becomes empty and all promises have completed;
   * `queue.size === 0 && queue.pending === 0`
   *
   * The difference with `empty` is that `idle` guarantees that all work from the queue has
   * finished. empty merely signals that the queue is empty, but it could mean that some promises
   * haven't completed yet.
   */
  IDLE = 'idle',
  /** Emitted when the queue is empty and no more items will be processed. */
  EMPTY = 'empty',
  /**
   * Emitted every time the add method is called and the number of pending or queued tasks is
   * increased
   */
  ADD = 'add',
  /**
   * Emitted every time a task is completed and the number of pending or queued tasks is decreased.
   * This is emitted regardless of whether the task completed normally or with an error.
   */
  NEXT = 'next',
  /** Emitted when an item completes without error */
  COMPLETED = 'completed',
  /** Emitted if an item throws an error */
  ERROR = 'error',
}
/** Job queue event names */
export type EventName = 'active' | 'idle' | 'empty' | 'add' | 'next' | 'completed' | 'error';

/** All possible event names */
export const EVENT_NAMES: EventName[] = [
  EVENT_NAME.ACTIVE,
  EVENT_NAME.IDLE,
  EVENT_NAME.EMPTY,
  EVENT_NAME.ADD,
  EVENT_NAME.NEXT,
  EVENT_NAME.COMPLETED,
  EVENT_NAME.ERROR,
];
