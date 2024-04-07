/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Layer } from '@mdf.js/core';
import { LoggerConfig } from '@mdf.js/logger';
import { ConsumerOptions } from '@mdf.js/openc2';
import { Setup } from '@mdf.js/service-setup-provider';
import { RetryOptions } from '@mdf.js/utils';
import { ObservabilityServiceOptions } from '../observability';
import { ConsumerAdapterOptions } from './ConsumerAdapterOptions.i';
import { CustomSetting } from './CustomSetting.t';

/**
 * Deploying configuration options. This configuration is used to setup the application or
 * microservice to be deployed in a specific environment, we can configure:
 * - Application/microservice metadata information.
 * - Remoto control interface (OpenC2 Consumer)
 * - Observability service.
 * - Logger configuration.
 * - Retry options.
 */
export interface ServiceRegistryOptions<
  CustomSettings extends Record<string, CustomSetting> = Record<string, CustomSetting>,
> {
  /**
   * Metadata information of the application or microservice. This information is used to identify
   * the application in the logs, metrics, and traces... and is shown in the service observability
   * endpoints.
   */
  metadata?: Partial<Layer.App.Metadata>;
  /**
   * OpenC2 Consumer configuration options. This configuration is used to setup the OpenC2
   * consumer, ff this configuration is not provided the consumer will not be started. The consumer
   * is used to receive OpenC2 commands from a central controller.
   */
  consumerOptions?: Partial<ConsumerOptions>;
  /**
   * Consumer adapter options: Redis or SocketIO. In order to configure the consumer instance,
   * `consumer` and `adapter` options must be provided, in other case the consumer will not be
   * started.
   */
  adapterOptions?: ConsumerAdapterOptions;
  /** Observability instance options */
  observabilityOptions?: Partial<ObservabilityServiceOptions>;
  /**
   * Logger Options. If provided, a logger instance from the `@mdf.js/logger` package will be
   * created and used by the application in all the internal services of the Application Wrapper.
   * At the same time, the logger is exposed to the application to be used in the application
   * services. If this options is not provided, a `Debug` logger will be used internally, but it
   * will not be exposed to the application.
   */
  loggerOptions?: Partial<LoggerConfig>;
  /**
   * Retry options. If provided, the application will use this options to retry to start the
   * services/resources registered in the Application Wrapped instance. If this options is not
   * provided, the application will not retry to start the services/resources.
   */
  retryOptions?: Partial<Omit<RetryOptions, 'logger' | 'interrupt' | 'abortSignal'>>;
  /**
   * Configuration loader options. These options is used to load the configuration information
   * of the application that is been wrapped by the Application Wrapper. This configuration could be
   * loaded from files or environment variables, or even both.
   *
   * To understand the configuration loader options, check the documentation of the package
   * [@mdf.js/service-setup-provider](https://www.npmjs.com/package/@mdf.js/service-setup-provider).
   *
   * @remarks Use different files for Application Wrapper configuration and for your own services to
   * avoid conflicts.
   */
  configLoaderOptions?: Partial<Setup.Config<CustomSettings>>;
}

export interface ServiceRegistrySettings<
  CustomSettings extends Record<string, CustomSetting> = Record<string, CustomSetting>,
> extends ServiceRegistryOptions<CustomSettings> {
  metadata: Layer.App.Metadata;
  consumerOptions?: ConsumerOptions;
  adapterOptions?: ConsumerAdapterOptions;
  observabilityOptions: ObservabilityServiceOptions;
  loggerOptions: LoggerConfig;
  retryOptions: RetryOptions;
  configLoaderOptions: Setup.Config<CustomSettings>;
}
