/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { TaskItem } from '.';
import { DLList } from '../dlList';

/**
 * Represents a synchronization mechanism for executing tasks in a controlled manner.
 */
export class Sync {
  /** The name of the Sync instance */
  private _name: string;
  /** The number of tasks currently running */
  private _running = 0;
  /** The queue of tasks to be executed */
  private _queue = new DLList<TaskItem>(
    () => {
      return;
    },
    () => {
      return;
    }
  );

  /**
   * Creates a new instance of the Sync class.
   * @param name - The name of the Sync instance.
   */
  constructor(name: string) {
    this._name = name;
  }

  /**
   * Checks if the Sync instance's task queue is empty.
   * @returns True if the task queue is empty, false otherwise.
   */
  public isEmpty(): boolean {
    return this._queue.length == 0;
  }

  /**
   * Tries to run a task from the queue if the Sync instance is not already running and
   * there are tasks in the queue.
   */
  private async _tryToRun(): Promise<void> {
    if (this._running < 1 && this._queue.length > 0) {
      this._running++;
      const taskItem: TaskItem | null = this._queue.shift();
      const cb = async () => {
        try {
          const returned = await taskItem?.task(...taskItem?.args);
          // return () => taskItem?.resolve?.(returned);
          taskItem?.resolve?.(returned);
        } catch (error) {
          // return () => taskItem?.reject?.(error);
          taskItem?.reject?.(error);
        }
      };

      this._running--;
      this._tryToRun();
      cb();
    }
  }

  /**
   * Schedules a task to be executed and returns a promise that resolves when the task completes.
   * @param task - The task function to be executed.
   * @param args - Arguments to be passed to the task function.
   * @returns A promise that resolves with the result of the task function.
   */
  public schedule(task: (...args: any[]) => any, ...args: any[]): Promise<any> {
    let resolve: ((value: any) => void) | null = null;
    let reject: ((reason: any) => void) | null = null;
    const promise = new Promise((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
    });
    const taskItem: TaskItem = { task, args, resolve, reject };
    this._queue.push(taskItem);
    this._tryToRun();
    return promise;
  }

  /*
   * ---------------------------------------------------------------------------------------------
   * GETTERS
   * ---------------------------------------------------------------------------------------------
   */
  /** Gets the name of the Sync instance */
  public get name(): string {
    return this._name;
  }
}
