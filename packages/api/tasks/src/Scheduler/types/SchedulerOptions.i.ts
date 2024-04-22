/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { LoggerInstance } from '@mdf.js/logger';
import { LimiterOptions } from '../../Limiter';
import { DefaultPollingGroups, PollingGroup } from '../../Polling';
import { TaskBaseConfig } from '../../Polling/types/TaskBaseConfig.i';

/** Represents the resource configuration */
export interface ResourceConfigEntry<
  Result = any,
  Binding = any,
  PollingGroups extends PollingGroup = DefaultPollingGroups,
> {
  /** The polling groups */
  pollingGroups: { [polling in PollingGroups]?: TaskBaseConfig<Result, Binding>[] };
  /** The limiter options */
  limiterOptions?: LimiterOptions;
}

/**
 * Represents the resources object, a map of resources with their polling groups and the tasks to
 * execute in that polling groups
 */
export interface ResourcesConfigObject<
  Result = any,
  Binding = any,
  PollingGroups extends PollingGroup = DefaultPollingGroups,
> {
  /** The resources entries */
  [resource: string]: ResourceConfigEntry<Result, Binding, PollingGroups>;
}

/** Represents the options for the scheduler */
export interface SchedulerOptions<
  Result = any,
  Binding = any,
  PollingGroups extends PollingGroup = DefaultPollingGroups,
> {
  /** The logger for the scheduler */
  logger?: LoggerInstance;
  /** The entries for the scheduler */
  resources?: ResourcesConfigObject<Result, Binding, PollingGroups>;
  /** The limiter options */
  limiterOptions?: LimiterOptions;
}
