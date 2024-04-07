/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Layer } from '@mdf.js/core';
import { LoggerInstance } from '@mdf.js/logger';
import { ObservabilityServiceOptions } from './ObservabilityServiceOptions.i';

export interface ObservabilityOptions {
  /** Application metadata information */
  metadata: Layer.App.Metadata;
  /** Observability service options */
  service?: ObservabilityServiceOptions;
  /** Logger instance */
  logger?: LoggerInstance;
}
