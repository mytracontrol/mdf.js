/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Layer } from '@mdf.js/core';
import { Crash, Multi } from '@mdf.js/crash';
import { Setup } from '@mdf.js/service-setup-provider';
import escalade from 'escalade/sync';
import EventEmitter from 'events';
import fs from 'fs';
import { cloneDeep, get, merge, omit } from 'lodash';
import markdown from 'markdown-it';
import normalize, { Input, Package } from 'normalize-package-data';
import { v4 } from 'uuid';
import {
  BootstrapOptions,
  CustomSetting,
  ServiceRegistryOptions,
  ServiceRegistrySettings,
} from '../types';
import {
  DEFAULT_SERVICE_REGISTRY_CONFIG_CONFIG_LOADER_OPTIONS,
  DEFAULT_SERVICE_REGISTRY_OPTIONS,
  DEFAULT_SERVICE_REGISTRY_SETTINGS_ENV_CONFIG,
} from './types';

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
export class SettingsManagerBase<
  CustomSettings extends Record<string, CustomSetting> = Record<string, CustomSetting>,
> extends EventEmitter {
  /** Instance identifier */
  public readonly instanceId = v4();
  /** Service Register Settings provider */
  protected readonly serviceRegistrySettingsProvider: Setup.Provider<
    ServiceRegistrySettings<CustomSettings>
  >;
  /** Custom Settings provider */
  protected readonly customSettingsProvider: Setup.Provider<CustomSettings>;
  /** Package version info */
  public readonly package?: Package;
  /** Readme file content */
  public readonly readme?: string;
  /** Validation error, if exist */
  protected _error?: Multi;
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
    bootstrapSettings?: BootstrapOptions,
    serviceRegistrySettings?: ServiceRegistryOptions<CustomSettings>,
    customSettings?: Partial<CustomSettings>
  ) {
    super();
    this.readme = this.loadReadme(bootstrapSettings?.loadReadme);
    this.serviceRegistrySettingsProvider = Setup.Factory.create(
      this.defineServiceRegistryConfigManagerOptions(bootstrapSettings, serviceRegistrySettings)
    ) as Setup.Provider<ServiceRegistrySettings<CustomSettings>>;
    this.customSettingsProvider = Setup.Factory.create(
      this.defineCustomSettingsConfigManager(
        this.serviceRegistrySettingsProvider.client.config.configLoaderOptions,
        customSettings
      )
    ) as Setup.Provider<CustomSettings>;
    this.addError(this.serviceRegistrySettingsProvider.client.error);
    this.addError(this.customSettingsProvider.client.error);
  }
  /**
   * Loads package.json information, normalizing its structure and extracting relevant metadata for
   * application settings.
   * @param flag - Indicates whether package information should be loaded or not.
   * @returns An object containing parsed package information or undefined if loading is not
   * requested or fails.
   */
  private loadPackageInfo(flag?: boolean): Partial<ServiceRegistryOptions> | undefined {
    if (!flag) {
      return undefined;
    }
    let packageInfo: Package | undefined;
    try {
      const packagePath = escalade(process.cwd(), (dir, names) => {
        return names.includes('package.json') && 'package.json';
      });
      if (packagePath) {
        packageInfo = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        normalize(packageInfo as Input);
      }
    } catch (rawError) {
      const cause = Crash.from(rawError);
      this.addError(new Crash(`Error loading package info: ${cause.message}`, { cause }));
    }
    if (!packageInfo) {
      return undefined;
    }
    return {
      metadata: {
        name: packageInfo.name,
        description: packageInfo.description,
        version: packageInfo.version,
        release: packageInfo.version?.split('.')[0],
        tags: packageInfo.keywords,
        instanceId: get(packageInfo, `config.${packageInfo.name}.instanceId`, undefined),
        serviceId: get(packageInfo, `config.${packageInfo.name}.serviceId`, undefined),
        serviceGroupId: get(packageInfo, `config.${packageInfo.name}.serviceGroupId`, undefined),
        namespace: get(packageInfo, `config.${packageInfo.name}.namespace`, undefined),
        links: get(packageInfo, `config.${packageInfo.name}.links`, undefined),
      },
    };
  }
  /**
   * Loads `README.md` content, converting it to HTML using markdown-it for easy display or use
   * within the application.
   * @param fileName - The file name of the readme or a boolean indicating if the default
   * `README.md` should be loaded.
   * @returns The rendered HTML content of the `README.md` file or undefined if not found or
   * loading is not requested.
   */
  private loadReadme(fileName?: boolean | string): string | undefined {
    let readme: string | undefined;
    const _fileName = typeof fileName === 'boolean' ? 'README.md' : fileName;
    if (!_fileName) {
      return undefined;
    }
    try {
      const markdownPath = escalade(process.cwd(), (dir, names) => {
        return names.includes(_fileName) && _fileName;
      });
      if (markdownPath) {
        const md = markdown({ html: true, linkify: true, typographer: true });
        readme = md.render(fs.readFileSync(markdownPath, 'utf8'));
      }
    } catch (rawError) {
      const cause = Crash.from(rawError);
      this.addError(new Crash(`Error loading ${_fileName} info: ${cause.message}`, { cause }));
    }
    return readme;
  }
  /**
   * Adds an error to the validation error list, creating a new Multi error if necessary. If the
   * error is a Multi error, its causes are added to the list.
   * @param error - The error to add to the validation error list.
   */
  private addError(error?: Crash | Multi | Error): void {
    if (!error) {
      return;
    }
    if (!this._error) {
      this._error = new Multi(`Error in the service configuration`);
    }
    if (error instanceof Multi) {
      if (error.causes) {
        error.causes.forEach(cause => {
          this._error?.push(cause);
        });
      } else {
        this._error.push(error);
      }
    } else if (error instanceof Crash) {
      this._error.push(error);
    } else {
      this._error.push(Crash.from(error));
    }
  }
  /**
   * Defines the configuration options to create an instance of a `ConfigManager` `Provider` to
   * manage the Service Registry settings, based in the Bootstrap settings and the Service Registry
   * initial settings.
   * @param bootstrapSettings - Bootstrap settings
   * @param serviceRegistrySettings - Initial Service Registry settings
   * @returns The configuration options for initializing the `ServiceRegistry` `ConfigManager`
   * `Provider`.
   */
  private defineServiceRegistryConfigManagerOptions(
    bootstrapSettings?: BootstrapOptions,
    serviceRegistrySettings?: ServiceRegistryOptions<CustomSettings>
  ): Layer.Provider.FactoryOptions<Setup.Config<ServiceRegistrySettings<CustomSettings>>> {
    const _feed = merge(
      cloneDeep({ ...DEFAULT_SERVICE_REGISTRY_OPTIONS }),
      { metadata: { instanceId: this.instanceId } },
      this.loadPackageInfo(bootstrapSettings?.loadPackage),
      omit(serviceRegistrySettings, ['consumer'])
    );
    const _envPrefix =
      bootstrapSettings?.useEnvironment === true
        ? DEFAULT_SERVICE_REGISTRY_SETTINGS_ENV_CONFIG
        : undefined;
    return {
      name: `ServiceRegistry`,
      config: merge(cloneDeep(DEFAULT_SERVICE_REGISTRY_CONFIG_CONFIG_LOADER_OPTIONS), {
        configFiles: bootstrapSettings?.configFiles,
        presetFiles: bootstrapSettings?.presetFiles,
        preset: bootstrapSettings?.preset,
        envPrefix: _envPrefix,
        feed: _feed,
      }),
      useEnvironment: false,
    };
  }
  /**
   * Defines the configuration options to create an instance of a `ConfigManager` `Provider` to
   * manage the Custom settings, based on the Service Registry settings and the initial custom
   * settings.
   * @param configLoader - Configuration loader settings
   * @param customSettings - Initial Custom settings
   * @returns The configuration options for initializing the Custom settings `ConfigManager`
   * `Provider`.
   */
  private defineCustomSettingsConfigManager(
    configLoader?: Setup.Config<CustomSettings>,
    customSettings?: Partial<CustomSettings>
  ): Layer.Provider.FactoryOptions<Setup.Config<CustomSettings>> {
    return {
      name: `CustomSettings`,
      config: {
        ...configLoader,
        feed: customSettings,
      },
      useEnvironment: false,
    };
  }
  /** Start the underlying configuration providers */
  public async start(): Promise<void> {
    await this.serviceRegistrySettingsProvider.start();
    await this.customSettingsProvider.start();
  }
  /** Stop the underlying configuration providers */
  public async stop(): Promise<void> {
    await this.serviceRegistrySettingsProvider.stop();
    await this.customSettingsProvider.stop();
  }
  /** Close the underlying configuration providers */
  public async close(): Promise<void> {
    await this.serviceRegistrySettingsProvider.close();
    await this.customSettingsProvider.close();
  }
}
