/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { LoggerInstance } from '@mdf.js/logger';
import { PortConfigValidationStruct } from '.';

/**
 * Provider configuration options
 * @param PortConfig - Port configuration object, could be an extended version of the client config
 */
export interface ProviderOptions<PortConfig> {
  /** Provider name, used for human-readable logs and identification */
  name: string;
  /**
   * Provider type, kind of component form the points of view of the health check standard
   * https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check-06
   */
  type: string;
  /** Port validation options */
  validation: PortConfigValidationStruct<PortConfig>;
  /**
   * String is used as prefix for the environment configuration variables, represented in
   * `SCREAMING_SNAKE_CASE`, that will parsed to `camelCase` and merged with the rest of the
   * configuration.
   *
   * @example
   * ```ts
   * // Environment variables
   * process.env.PORT_NAME_TYPE = 'http';
   * process.env.PORT_NAME_HOST = 'localhost';
   * process.env.PORT_NAME_PORT = '8080';
   * process.env.PORT_NAME_OTHER_CONFIG__MY_CONFIG = 'true';
   * ```
   *
   * ```ts
   * // Provider configuration
   * {
   *    name: 'port-name',
   *    type: 'http',
   *    validation: {...},
   *    envPrefix: 'PORT_NAME_',
   * }
   * ```
   * ```ts
   * // Resulting configuration
   * {
   *    type: 'http',
   *    host: 'localhost',
   *    port: 8080,
   *    otherConfig: {
   *      myConfig: true,
   *    },
   * }
   * ```
   */
  useEnvironment?: boolean | string;
  /** Port and provider logger, to be used internally */
  logger?: LoggerInstance;
}
