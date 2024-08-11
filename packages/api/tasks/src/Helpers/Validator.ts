/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import ms from 'ms';
import {
  DefaultPollingGroups,
  GroupTaskBaseConfig,
  PollingGroup,
  SequenceTaskBaseConfig,
  SingleTaskBaseConfig,
  TaskBaseConfig,
  WellIdentifiedTaskOptions,
} from '../Polling';
import { ResourceConfigEntry, ResourcesConfigObject } from '../Scheduler';

export class Validator {
  /**
   * Validate the resources configuration
   * @param resources - The resources configuration
   */
  public static validateResources<
    Result = any,
    Binding = any,
    PollingGroups extends PollingGroup = DefaultPollingGroups,
  >(resources: ResourcesConfigObject<Result, Binding, PollingGroups>): void {
    if (!resources || typeof resources !== 'object' || Array.isArray(resources)) {
      throw new Crash(`The resources should be an object: ${JSON.stringify(resources, null, 2)}`);
    }
    for (const [resource, entry] of Object.entries(resources)) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        throw new Crash(
          `The resource entry should be an object: ${JSON.stringify(entry, null, 2)}`
        );
      }
      if (typeof resource !== 'string' || resource.length < 1) {
        throw new Crash(
          `The resource should be a non empty string: ${JSON.stringify(resource, null, 2)}`
        );
      }
      Validator.valideEntry(entry);
    }
  }
  /**
   * Check if the entry is valid
   * @param entry - The entry to add to the scheduler
   */
  public static valideEntry<
    Result = any,
    Binding = any,
    PollingGroups extends PollingGroup = DefaultPollingGroups,
  >(entry: ResourceConfigEntry<Result, Binding, PollingGroups>): void {
    for (const [polling, tasks] of Object.entries(entry.pollingGroups)) {
      Validator.isValidPeriod(polling);
      if (!Array.isArray(tasks)) {
        throw new Crash(`The tasks should be an array of tasks: ${JSON.stringify(tasks, null, 2)}`);
      }
      for (const task of tasks) {
        Validator.isValidConfig(task);
      }
    }
  }
  /**
   * Check if the task configuration is a single task configuration
   * @param config - The task configuration
   */
  public static isSingleTaskConfig(config: TaskBaseConfig): config is SingleTaskBaseConfig {
    try {
      Validator.isValidConfig(config);
      return 'task' in config;
    } catch {
      return false;
    }
  }
  /**
   * Check if the task configuration is a group task configuration
   * @param config - The task configuration
   */
  public static isGroupTaskConfig(config: TaskBaseConfig): config is GroupTaskBaseConfig {
    try {
      Validator.isValidConfig(config);
      return 'tasks' in config;
    } catch {
      return false;
    }
  }
  /**
   * Check if the task configuration is a sequence task configuration
   * @param config - The task configuration
   */
  public static isSequenceTaskConfig(config: TaskBaseConfig): config is SequenceTaskBaseConfig {
    try {
      Validator.isValidConfig(config);
      return 'pattern' in config;
    } catch {
      return false;
    }
  }
  /** Check if the period is valid */
  private static isValidPeriod(period: string): void {
    if (typeof period !== 'string' || period.length < 2 || !Validator.isValidEndForPeriod(period)) {
      throw new Crash(`The period should be a string with the format <number><ms|s|m|h|d>`);
    } else {
      try {
        const value = ms(period);
        if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
          throw new Crash(`Wrong period value [${period}]`);
        }
      } catch (rawError) {
        const error = Crash.from(rawError);
        throw new Crash(
          `The period could not be parsed: ${error.message}, the period should be a string with the format <number><ms|s|m|h|d>`
        );
      }
    }
  }
  /**
   * Check if the period is based on milliseconds, seconds, minutes, hours or days
   * @param period - The period to check
   * @returns - True if the period is valid
   */
  private static isValidEndForPeriod(period: string): boolean {
    return (
      period.endsWith('ms') ||
      period.endsWith('s') ||
      period.endsWith('m') ||
      period.endsWith('h') ||
      period.endsWith('d')
    );
  }
  /** Check if the configuration is valid */
  private static isValidConfig(config: TaskBaseConfig): void {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      throw new Crash(`The task configuration should be an object`);
    } else {
      if ('task' in config) {
        Validator.isValidSingleTaskConfig(config as SingleTaskBaseConfig);
      } else if ('tasks' in config) {
        Validator.isValidGroupConfig(config as GroupTaskBaseConfig);
      } else if ('pattern' in config) {
        Validator.isValidSequenceConfig(config as SequenceTaskBaseConfig);
      } else {
        throw new Crash(`The task configuration should have a task, tasks or pattern property`);
      }
    }
  }
  /**
   * Check if the task configuration is valid
   * @param config - The task configuration
   */
  private static isValidSingleTaskConfig(config: SingleTaskBaseConfig): void {
    if (typeof config.task !== 'function') {
      throw new Crash(
        `The task should be a function or a promise: ${JSON.stringify(config, null, 2)}`
      );
    } else if ('taskArgs' in config && !Array.isArray(config.taskArgs)) {
      throw new Crash(`The taskArgs should be an array: ${JSON.stringify(config, null, 2)}`);
    } else {
      Validator.isValidTaskOptions(config.options);
    }
  }
  /**
   * Check if the task options are valid
   * @param options - The task options
   */
  private static isValidTaskOptions(options: WellIdentifiedTaskOptions): void {
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      throw new Crash(`The options should be an object: ${JSON.stringify(options, null, 2)}`);
    } else if (!('id' in options)) {
      throw new Crash(
        `The options should have an id property: ${JSON.stringify(options, null, 2)}`
      );
    } else if (typeof options.id !== 'string') {
      throw new Crash(`The id should be a string: ${JSON.stringify(options, null, 2)}`);
    } else if (options.id.length < 1) {
      throw new Crash(`The id should be a non empty string: ${JSON.stringify(options, null, 2)}`);
    } else if (options.id.length > 255) {
      throw new Crash(
        `The id should be a string with less than 255 characters: ${JSON.stringify(options, null, 2)}`
      );
    }
  }
  /**
   * Check if the group configuration is valid
   * @param config - The group configuration
   */
  private static isValidGroupConfig(config: GroupTaskBaseConfig): void {
    if (!Array.isArray((config as GroupTaskBaseConfig).tasks)) {
      throw new Crash(`The tasks should be an array of tasks: ${JSON.stringify(config, null, 2)}`);
    } else {
      for (const task of (config as GroupTaskBaseConfig).tasks) {
        Validator.isValidSingleTaskConfig(task);
      }
      Validator.isValidTaskOptions(config.options);
    }
  }
  /**
   * Check if the sequence configuration is valid
   * @param config - The sequence configuration
   */
  private static isValidSequenceConfig(config: SequenceTaskBaseConfig): void {
    if (
      !('pattern' in config) ||
      !config.pattern ||
      typeof config.pattern !== 'object' ||
      Array.isArray(config.pattern)
    ) {
      throw new Crash(
        `Pattern should be an object an object with the task property: ${JSON.stringify(
          config,
          null,
          2
        )}`
      );
    } else if (
      !('task' in config.pattern) ||
      !config.pattern.task ||
      typeof config.pattern.task !== 'object' ||
      Array.isArray(config.pattern.task)
    ) {
      throw new Crash(
        `The sequence configuration should have a task property: ${JSON.stringify(config, null, 2)}`
      );
    } else if ('pre' in config.pattern && !Array.isArray(config.pattern.pre)) {
      throw new Crash(
        `The pre property should be an array of tasks: ${JSON.stringify(config, null, 2)}`
      );
    } else if ('post' in config.pattern && !Array.isArray(config.pattern.post)) {
      throw new Crash(
        `The post property should be an array of tasks: ${JSON.stringify(config, null, 2)}`
      );
    } else if ('finally' in config.pattern && !Array.isArray(config.pattern.finally)) {
      throw new Crash(
        `The finally property should be an array of tasks: ${JSON.stringify(config, null, 2)}`
      );
    } else {
      if ('task' in config.pattern) {
        Validator.isValidSingleTaskConfig(config.pattern.task);
      }
      if ('pre' in config.pattern && Array.isArray(config.pattern.pre)) {
        for (const task of config.pattern.pre) {
          Validator.isValidSingleTaskConfig(task);
        }
      }
      if ('post' in config.pattern && Array.isArray(config.pattern.post)) {
        for (const task of config.pattern.post) {
          Validator.isValidSingleTaskConfig(task);
        }
      }
      if ('finally' in config.pattern && Array.isArray(config.pattern.finally)) {
        for (const task of config.pattern.finally) {
          Validator.isValidSingleTaskConfig(task);
        }
      }
      Validator.isValidTaskOptions(config.options);
    }
  }
}
