/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Mytra Control S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Mytra Control S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Mytra Control S.L.
 */

import { LoggerInstance } from '@mdf/logger';
import { PortConfigValidationStruct } from '.';

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
   * Boolean flag indicating that the build in environment configuration should be used, merged with
   * the default values and the configuration passed as argumento to the provider
   */
  useEnvironment?: boolean;
  /** Port and provider logger, to be used internally */
  logger?: LoggerInstance;
}
