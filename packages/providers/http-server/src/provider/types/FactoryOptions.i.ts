/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { LoggerInstance } from '@mdf.js/provider';
import { Config } from './Config.t';

/** Factory configuration options */
export interface FactoryOptions {
  /** HTTP Server port configuration options */
  config: Partial<Config>;
  /** Provider name, used for human-readable logs and identification */
  name?: string;
  /**
   * Boolean flag indicating that the build in environment configuration should be used, merged with
   * the default values and the configuration passed as argumento to the provider
   */
  useEnvironment?: boolean;
  /** Port and provider logger, to be used internally */
  logger?: LoggerInstance;
}
