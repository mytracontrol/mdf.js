/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Layer } from '@mdf.js/core';
import { LoggerConfig } from '@mdf.js/logger';
import { Setup } from '@mdf.js/service-setup-provider';
import { RetryOptions } from '@mdf.js/utils';
import {
  DEFAULT_CONFIG_REGISTER_CLUSTER_UPDATE_INTERVAL,
  DEFAULT_CONFIG_REGISTER_INCLUDE_STACK,
  DEFAULT_CONFIG_REGISTER_MAX_LIST_SIZE,
  DEFAULT_PRIMARY_PORT,
  ObservabilityServiceOptions,
} from '../../observability';
import { ServiceRegistrySettings } from '../../types';

/**
 * Custom config preset selector, used to load a specific preset from the custom config folder.
 * Default files to search for are `./config/custom/presets/*.preset.*`
 * This preset is used for the custom config.
 * @defaultValue undefined
 */
const CONFIG_CUSTOM_PRESET = process.env['CONFIG_CUSTOM_PRESET'];
/**
 * Service registry preset selector, used to load a specific preset from the service registry config folder.
 * Default files to search for are `./config/presets/*.preset.*`
 * This preset is used for the service registry config.
 * @defaultValue undefined
 */
const CONFIG_SERVICE_REGISTRY_PRESET = process.env['CONFIG_SERVICE_REGISTRY_PRESET'];

/**
 * Application name
 * @defaultValue 'mdf-app'
 */
const CONFIG_APP_NAME = process.env['CONFIG_APP_NAME'];

/** Health service name */
export const CONFIG_SERVICE_NAME = 'settings';

/** Default application metadata */
export const DEFAULT_APP_METADATA: Layer.App.Metadata = {
  name: CONFIG_APP_NAME ?? 'mdf-app',
  release: '0.0.0',
  version: '0',
  description: undefined,
  // This is a placeholder, the actual value will be set by the service registry
  instanceId: '00000000-0000-0000-0000-000000000000',
  serviceId: 'mdf-service',
  serviceGroupId: 'mdf-service-group',
};

/** Default retry options for service startup */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  attempts: 3,
  maxWaitTime: 10000,
  timeout: 5000,
  waitTime: 1000,
};

/** Default service registry settings environment configuration */
export const DEFAULT_SERVICE_REGISTRY_SETTINGS_ENV_CONFIG: Record<string, string> = {
  metadata: 'CONFIG_METADATA_',
  observabilityOptions: 'CONFIG_OBSERVABILITY_',
  loggerOptions: 'CONFIG_LOGGER_',
  retryOptions: 'CONFIG_RETRY_OPTIONS_',
  adapterOptions: 'CONFIG_ADAPTER_',
};

/** Default observability options */
export const DEFAULT_OBSERVABILITY_OPTIONS: ObservabilityServiceOptions = {
  primaryPort: DEFAULT_PRIMARY_PORT,
  host: 'localhost',
  isCluster: false,
  includeStack: DEFAULT_CONFIG_REGISTER_INCLUDE_STACK,
  clusterUpdateInterval: DEFAULT_CONFIG_REGISTER_CLUSTER_UPDATE_INTERVAL,
  maxSize: DEFAULT_CONFIG_REGISTER_MAX_LIST_SIZE,
};

/** Default logger options */
export const DEFAULT_LOGGER_OPTIONS: LoggerConfig = {
  console: {
    enabled: true,
    level: 'info',
  },
  file: {
    enabled: false,
    level: 'info',
  },
};

/** Default custom config loader options */
export const DEFAULT_CUSTOM_CONFIG_LOADER_OPTIONS: Setup.Config = {
  configFiles: ['./config/custom/*.*'],
  presetFiles: ['./config/custom/presets/*.*'],
  schemaFiles: ['./config/custom/schemas/*.*'],
  preset: CONFIG_CUSTOM_PRESET ?? CONFIG_SERVICE_REGISTRY_PRESET,
};

/** Default service registry config loader options */
export const DEFAULT_SERVICE_REGISTRY_CONFIG_CONFIG_LOADER_OPTIONS: Setup.Config = {
  configFiles: ['./config/*.*'],
  presetFiles: ['./config/presets/*.*'],
  schemaFiles: ['./config/schemas/*.*'],
  preset: CONFIG_SERVICE_REGISTRY_PRESET,
};

/** Default service registry options */
export const DEFAULT_SERVICE_REGISTRY_OPTIONS: ServiceRegistrySettings = {
  metadata: DEFAULT_APP_METADATA,
  retryOptions: DEFAULT_RETRY_OPTIONS,
  observabilityOptions: DEFAULT_OBSERVABILITY_OPTIONS,
  loggerOptions: DEFAULT_LOGGER_OPTIONS,
  configLoaderOptions: DEFAULT_CUSTOM_CONFIG_LOADER_OPTIONS,
};
