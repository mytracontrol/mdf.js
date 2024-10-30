/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { TaskHandler } from './TaskHandler';
import { SequencePattern, TaskOptions } from './types';

export class Sequence<T, U> extends TaskHandler<T, U> {
  /**
   * Create a new task handler for a sequence of tasks
   * @param pattern - The pattern for the sequence
   * @param options - The options for the task
   */
  constructor(
    private readonly pattern: SequencePattern<T>,
    options?: TaskOptions<U>
  ) {
    super(options);
  }
  /** Execute the task */
  protected async _execute(): Promise<T> {
    try {
      await this.executePhase(this.pattern.pre, 'pre');
      const result = await this.pattern.task.execute();
      this._$meta.push(this.pattern.task.metadata);
      await this.executePhase(this.pattern.post, 'post');
      return result;
    } catch (error) {
      throw Crash.from(error);
    } finally {
      await this.executePhase(this.pattern.finally, 'finally');
    }
  }
  /** Execute a phase of the sequence */
  private async executePhase(tasks: TaskHandler<T, U>[] = [], phase: string): Promise<void> {
    for (const task of tasks) {
      try {
        await task.execute();
      } catch (rawError) {
        const cause = Crash.from(rawError);
        throw new Crash(`Error executing the [${phase}] phase: ${cause.message}`, { cause });
      } finally {
        this._$meta.push(task.metadata);
      }
    }
  }
}

