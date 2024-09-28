/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health } from '@mdf.js/core';
import { Crash, Multi } from '@mdf.js/crash';
import { LoggerInstance } from '@mdf.js/logger';
import EventEmitter from 'events';
import { Validator } from '../Helpers';
import { Limiter } from '../Limiter';
import { Group, MetaData, Sequence, SequencePattern, Single, TaskHandler } from '../Tasks';
import { PollingMetricsHandler } from './PollingStatsManager';
import { RetryManager } from './RetryManager';
import {
  DEFAULT_SLOW_CYCLE_RATIO,
  MetricsDefinitions,
  PollingManagerOptions,
  PollingStats,
  TaskBaseConfig,
} from './types';

export declare interface PollingManager {
  /** Emitted on every error */
  on(event: 'error', listener: (error: Crash | Multi) => void): this;
  /** Emitted when a task is passed to off, this means that the task has been disabled */
  on(event: 'off', listener: (taskId: string, task: TaskBaseConfig) => void): this;
  /** Emitted when a task is passed to slow cycle */
  on(event: 'slow', listener: (taskId: string, task: TaskBaseConfig) => void): this;
  /** Emitted when a task is passed to fast cycle */
  on(event: 'fast', listener: (taskId: string, task: TaskBaseConfig) => void): this;
  /** Emitted when a task has ended */
  on(
    event: 'done',
    listener: (uuid: string, result: any, meta: MetaData, error?: Crash | Multi) => void
  ): this;
  /** Emitted when a cycle has ended */
  on(event: 'endCycle', listener: (check: Health.Check<PollingStats>) => void): this;
  /** Emitted when a cycle has started */
  on(event: 'startCycle', listener: () => void): this;
}

export class PollingManager extends EventEmitter {
  /** Polling groups entries */
  private readonly fastEntries: Map<string, TaskBaseConfig> = new Map();
  /** Slow entries */
  private readonly slowEntries: Map<string, TaskBaseConfig> = new Map();
  /** Off entries */
  private readonly offEntries: Map<string, TaskBaseConfig> = new Map();
  /** Pending tasks */
  private readonly pending: Set<string> = new Set();
  /** Retry manager */
  private readonly retryManager: RetryManager;
  /** Metrics definitions */
  private readonly pollingStats: PollingMetricsHandler;
  /** Fast cycle ratio counter */
  private fastCycleRatioCounter = 0;
  /** Ratio of fast cycles to slow cycles */
  private factCycleToSlowCycleRatio;
  /**
   * Create a polling manager
   * @param options - Polling manager options
   * @param limiter - Rate limiter
   * @param logger - Logger instance
   * @param metrics - Metrics registry
   */
  constructor(
    private readonly options: PollingManagerOptions,
    private readonly limiter: Limiter,
    private readonly logger: LoggerInstance,
    private readonly metrics: MetricsDefinitions
  ) {
    super();
    this.factCycleToSlowCycleRatio =
      typeof options.slowCycleRatio === 'number'
        ? options.slowCycleRatio
        : DEFAULT_SLOW_CYCLE_RATIO;
    if (this.factCycleToSlowCycleRatio < 1) {
      throw new Crash(`Invalid slow cycle ratio: ${this.factCycleToSlowCycleRatio}`);
    }
    this.pollingStats = new PollingMetricsHandler(
      options.componentId,
      options.resource,
      options.pollingGroup,
      options.cyclesOnStats,
      this.metrics
    );
    this.retryManager = new RetryManager(
      this.limiter.options.delay,
      this.options.pollingGroup,
      this.logger
    );
    for (const entry of this.options.entries) {
      entry.options = this.retryManager.fastCycleRetryOptions(entry.options);
      this.fastEntries.set(entry.options.id, entry);
    }
  }
  /**
   * Schedule a task over the limiter
   * @param task - Task configuration
   */
  private scheduleTask(task: TaskHandler | undefined): string | undefined {
    if (!task) {
      return undefined;
    }
    this.logger.debug(`Scheduling task ${task.metadata.taskId}`);
    this.pending.add(task.metadata.taskId);
    this.pollingStats.addTaskInProgress(task.metadata.taskId);
    task.once('done', this.onDoneTaskHandler);
    return this.limiter.schedule(task);
  }
  /**
   * Create a task handler instance
   * @param config - task configuration
   * @returns A task handler instanced
   */
  private createTaskInstance(config: TaskBaseConfig): TaskHandler {
    try {
      if (Validator.isSingleTaskConfig(config)) {
        return new Single(config.task, config.taskArgs, config.options);
      } else if (Validator.isGroupTaskConfig(config)) {
        const tasks = config.tasks.map(task => this.createTaskInstance(task));
        return new Group(tasks, config.options);
      } else if (Validator.isSequenceTaskConfig(config)) {
        const pattern: SequencePattern = {
          pre: config.pattern.pre?.map(task => this.createTaskInstance(task)),
          task: this.createTaskInstance(config.pattern.task),
          post: config.pattern.post?.map(task => this.createTaskInstance(task)),
          finally: config.pattern.finally?.map(task => this.createTaskInstance(task)),
        };
        return new Sequence(pattern, config.options);
      } else {
        throw new Crash(
          `Unexpected error, a task configuration that was validated is not recognized`
        );
      }
    } catch (rawError) {
      const cause = Crash.from(rawError);
      const error = new Crash(
        `Error creating the instance of the task ${config.options.id}: [${cause.message}]`,
        { info: { cause, date: new Date(), subject: 'Task creation', task: config } }
      );
      this.logger.crash(error);
      if (this.listenerCount('error') > 0) {
        this.emit('error', error);
      }
      if (this.fastEntries.has(config.options.id)) {
        this.fastEntries.delete(config.options.id);
      } else if (this.slowEntries.has(config.options.id)) {
        this.slowEntries.delete(config.options.id);
      }
      this.offEntries.set(config.options.id, config);
      this.emit('off', config.options.id, config);
      throw error;
    }
  }
  /**
   * Create a task handler instance
   * @param config - Task configuration
   * @returns A task handler instance
   */
  private wrappedCreatedTaskInstance = (config: TaskBaseConfig): TaskHandler | undefined => {
    try {
      return this.createTaskInstance(config);
    } catch (error) {
      return undefined;
    }
  };
  /**
   * Task done handler
   * @param uuid - Task UUID
   * @param result - Task result
   * @param meta - Task metadata
   * @param error - Task error
   */
  private onDoneTaskHandler = (
    uuid: string,
    result: any,
    meta: MetaData,
    error?: Crash | Multi
  ) => {
    this.logger.debug(`[${meta.taskId}] finished as [${meta.status}] in ${meta.duration} ms`);
    this.pending.delete(meta.taskId);
    this.pollingStats.removeTaskInProgress(meta.taskId, meta.duration, error);
    if (error) {
      const task = this.fastEntries.get(meta.taskId);
      if (task) {
        task.options = this.retryManager.slowCycleRetryOptions(task.options);
        this.slowEntries.set(meta.taskId, task);
        this.fastEntries.delete(meta.taskId);
        this.emit('slow', meta.taskId, task);
      }
    } else {
      const task = this.slowEntries.get(meta.taskId);
      if (task) {
        task.options = this.retryManager.fastCycleRetryOptions(task.options);
        this.fastEntries.set(meta.taskId, task);
        this.slowEntries.delete(meta.taskId);
        this.emit('fast', meta.taskId, task);
      }
    }
    if (this.pending.size === 0) {
      this.logger.debug(
        `Polling group [${this.options.pollingGroup}] on [${this.options.resource}] finished`
      );
      this.pollingStats.finalizeCycle();
      this.emit('endCycle', this.pollingStats.check);
    }
    this.emit('done', uuid, result, meta, error);
  };
  /** Schedule the tasks to be executed */
  public schedule(): void {
    this.logger.debug(`Starting polling group ${this.options.pollingGroup}`);
    this.pollingStats.initializeCycle();
    this.emit('startCycle');
    this.fastCycleRatioCounter++;
    let _scheduled = 0;
    for (const task of this.fastEntries.values()) {
      this.scheduleTask(this.wrappedCreatedTaskInstance(task));
      _scheduled++;
    }
    if (this.fastCycleRatioCounter >= this.factCycleToSlowCycleRatio) {
      this.fastCycleRatioCounter = 0;
      for (const task of this.slowEntries.values()) {
        this.scheduleTask(this.wrappedCreatedTaskInstance(task));
        _scheduled++;
      }
    }
    if (_scheduled === 0) {
      this.logger.debug(`Polling group ${this.options.pollingGroup} has no tasks to execute`);
      this.pollingStats.finalizeCycle();
      this.emit('endCycle', this.pollingStats.check);
    }
  }
  /** Return the stats of the polling manager */
  public get check(): Health.Check {
    const _check = {
      ...this.pollingStats.check,
      observedValue: {
        ...this.pollingStats.check.observedValue,
        inFastCycleTasks: this.fastEntries.size,
        inSlowCycleTasks: this.slowEntries.size,
        inOffCycleTasks: this.offEntries.size,
        pendingTasks: this.pending.size,
      },
    };
    return _check;
  }
}
