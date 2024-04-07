/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health, Layer } from '@mdf.js/core';
import { Links, Multi } from '@mdf.js/crash';
import { LoggerConfig } from '@mdf.js/logger';
import { ConfigManager } from '@mdf.js/service-setup-provider';
import { RetryOptions } from '@mdf.js/utils';
import cluster from 'cluster';
import express from 'express';
import { merge } from 'lodash';
import { ObservabilityOptions } from '../observability';
import { BootstrapSettings, CustomSetting, ServiceRegistryOptions, ServiceSetting } from '../types';
import { Router } from './Router';
import { SettingsManagerBase } from './SettingsManagerBase';
import { CONFIG_SERVICE_NAME, DEFAULT_RETRY_OPTIONS } from './types';

/**
 * SettingsManager is responsible for managing the application's settings, including the
 * configuration for the service registry and custom settings specified by the user. It extends
 * EventEmitter to allow for emitting events related to settings management and implements the
 * Service interface from the Layer.App namespace, indicating its role in the application's service
 * architecture. It utilizes configuration managers for both service registry and custom settings,
 * supporting dynamic loading and management of these configurations.
 *
 * Additionally, it can load application metadata from package.json and README.md content, providing
 * a centralized way to access application information and documentation.
 */
export class SettingsManagerAccessors<
    CustomSettings extends Record<string, CustomSetting> = Record<string, CustomSetting>,
  >
  extends SettingsManagerBase<CustomSettings>
  implements Layer.App.Service
{
  /** Settings Manager Router */
  private readonly _router: Router;
  /**
   * Constructs a SettingsManager instance, initializing configuration providers and loading
   * `package.json` and README information.
   * @param bootstrapSettings - Bootstrap settings, define how the Custom and the Service Registry
   * settings should be loaded.
   * @param serviceRegistrySettings - Service Registry settings, used as a base for the Service
   * Registry configuration manager.
   * @param customSettings - Custom settings provided by the user, used as a base for the Custom
   * configuration manager.
   */
  constructor(
    bootstrapSettings?: BootstrapSettings,
    serviceRegistrySettings?: ServiceRegistryOptions<CustomSettings>,
    customSettings?: Partial<CustomSettings>
  ) {
    super(bootstrapSettings, serviceRegistrySettings, customSettings);
    this._router = new Router(this);
  }
  /** @returns Service name */
  public get name(): string {
    return CONFIG_SERVICE_NAME;
  }
  /** @returns Service instance identifier */
  public get componentId(): string {
    return this.metadata.instanceId;
  }
  /** @returns Settings manager status */
  public get status(): Health.Status {
    return Health.overallStatus(this.checks);
  }
  /** @returns Settings manager checks */
  public get checks(): Health.Checks {
    const _checks: Health.Checks = { [`${this.metadata.name}:settings`]: [] };
    const _unwindChecks = (_value: Health.Checks) => {
      for (const [key, entries] of Object.entries(_value)) {
        const _key = key.split(':')[0];
        _checks[`${this.metadata.name}:settings`].push(
          ...entries.map(entry => ({
            ...entry,
            scope: `${_key}`,
            componentId: this.componentId,
            observedUnit: 'status',
          }))
        );
      }
    };
    _unwindChecks(this.serviceRegistrySettingsProvider.checks);
    _unwindChecks(this.customSettingsProvider.checks);
    return _checks;
  }
  /** @returns A validation error, if exist, in the configuration loaded */
  public get error(): Multi | undefined {
    return this._error;
  }
  /** @returns Service Metadata */
  public get metadata(): Layer.App.Metadata {
    return this.serviceRegistrySettingsProvider.client.config.metadata;
  }
  /** @returns Application namespace */
  public get namespace(): string | undefined {
    return this.metadata.namespace;
  }
  /** @returns Application release */
  public get release(): string {
    return this.metadata.release;
  }
  /** @returns Observability options */
  public get observability(): ObservabilityOptions {
    return {
      metadata: this.metadata,
      service: this.serviceRegistrySettingsProvider.client.config.observabilityOptions,
    };
  }
  /** @returns Logger configuration */
  public get logger(): LoggerConfig | undefined {
    return this.serviceRegistrySettingsProvider.client.config.loggerOptions;
  }
  /** @returns If the application is the primary node in the cluster */
  public get isPrimary(): boolean {
    return this.serviceRegistrySettingsProvider.client.config.observabilityOptions?.isCluster
      ? cluster.isPrimary
      : false;
  }
  /** @returns If the application is a worker node in the cluster */
  public get isWorker(): boolean {
    return this.serviceRegistrySettingsProvider.client.config.observabilityOptions?.isCluster
      ? cluster.isWorker
      : false;
  }
  /** @returns Service Register Configuration Manager */
  public get serviceRegisterConfigManager(): ConfigManager<ServiceRegistryOptions<CustomSettings>> {
    return this.serviceRegistrySettingsProvider.client;
  }
  /** @returns Service Register settings */
  public get serviceRegistrySettings(): ServiceRegistryOptions<CustomSettings> {
    return this.serviceRegistrySettingsProvider.client.config;
  }
  /** @returns Custom Configuration Manager */
  public get customRegisterConfigManager(): ConfigManager<CustomSettings> {
    return this.customSettingsProvider.client;
  }
  /** @returns Custom settings */
  public get customSettings(): CustomSettings {
    return this.customSettingsProvider.client.config;
  }
  /** @returns Service settings */
  public get settings(): ServiceSetting<CustomSettings> {
    return {
      ...this.serviceRegistrySettings,
      custom: this.customSettings,
    };
  }
  /** Get the retry options */
  public get retryOptions(): RetryOptions | undefined {
    return merge(
      {},
      {
        ...DEFAULT_RETRY_OPTIONS,
      },
      this.serviceRegistrySettingsProvider.client.config.retryOptions
    );
  }
  /** @returns Express router with access to config information */
  public get router(): express.Router {
    return this._router.router;
  }
  /** @returns Links offered by this service */
  public get links(): Links {
    return {
      [`${CONFIG_SERVICE_NAME}`]: {
        config: `/${CONFIG_SERVICE_NAME}/config`,
        presets: `/${CONFIG_SERVICE_NAME}/presets`,
        readme: `/${CONFIG_SERVICE_NAME}/readme`,
      },
    };
  }
}
