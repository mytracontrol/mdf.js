/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { LoggerInstance } from '@mdf.js/logger';

/** Factory configuration options */
export interface FactoryOptions<PortConfig> {
  /** Specific port configuration options */
  config?: Partial<PortConfig>;
  /** Provider name, used for human-readable logs and identification */
  name?: string;
  /**
   * Flag indicating that the environment configuration variables should be used, merged with
   * the default values and the configuration passed as argument to the provider.
   *
   * If a string is passed this will be used as prefix for the environment configuration variables,
   * represented in `SCREAMING_SNAKE_CASE`, that will parsed to `camelCase` and merged with the rest
   * of the configuration.
   */
  useEnvironment?: boolean | string;
  /** Port and provider logger, to be used internally */
  logger?: LoggerInstance;
}
