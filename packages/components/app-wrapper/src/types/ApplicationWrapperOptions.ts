/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Layer } from '@mdf.js/core';
import { LoggerConfig } from '@mdf.js/logger';
import { ObservabilityServiceOptions } from '@mdf.js/observability';
import { ConsumerOptions, Control } from '@mdf.js/openc2';
import { RetryOptions } from '@mdf.js/utils';
import { ConsumerAdapterOptions } from './ConsumerAdapterOptions.i';

export interface ApplicationWrapperOptions {
  /** Application or or microservice name */
  name: string;
  /** Application definition */
  application?: Partial<Omit<Layer.App.Metadata, 'instanceId' | 'name'>>;
  /** Namespace used by this application */
  namespace?: Control.Namespace;
  /** Observability options */
  observability?: ObservabilityServiceOptions;
  /** Logger Options */
  logger?: LoggerConfig;
  /** Consumer options */
  consumer?: Partial<ConsumerOptions>;
  /** Consumer adapter options */
  adapter?: ConsumerAdapterOptions;
  /** Retry options */
  retryOptions?: RetryOptions;
}
