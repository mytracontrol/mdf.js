/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health, Layer } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { Logger, LoggerInstance, SetContext } from '@mdf.js/logger';
import { CommandJobHandler, ResolverMap } from '@mdf.js/openc2';
import { RetryOptions, deCycle, retryBind } from '@mdf.js/utils';
import EventEmitter from 'events';
import { ControlManager } from './control';
import { ErrorRecord, Metrics, Observability } from './observability';
import { SettingsManager } from './settings';
import {
  BootstrapOptions,
  CustomSetting,
  SHUTDOWN_DELAY,
  ServiceRegistryOptions,
  ServiceRegistrySettings,
  ServiceSetting,
} from './types';

export declare interface ServiceRegistry {
  /**
   * Add a listener for the `command` event, emitted when a new command is received
   * @param event - `command` event
   * @param listener - Command event listener
   * @event
   */
  on(event: 'command', listener: (job: CommandJobHandler) => void): this;
  /**
   * Add a listener for the `command` event, emitted when a new command is received
   * @param event - `command` event
   * @param listener - Command event listener
   * @event
   */
  addListener(event: 'command', listener: (job: CommandJobHandler) => void): this;
  /**
   * Add a listener for the `command` event, emitted when a new command is received. This is a
   * one-time event, the listener will be removed after the first emission.
   * @param event - `command` event
   * @param listener - Command event listener
   * @event
   */
  once(event: 'command', listener: (job: CommandJobHandler) => void): this;
  /**
   * Removes the specified listener from the listener array for the `command` event.
   * @param event - `command` event
   * @param listener - Command event listener
   * @event
   */
  off(event: 'command', listener: (job: CommandJobHandler) => void): this;
  /**
   * Removes the specified listener from the listener array for the `command` event.
   * @param event - `command` event
   * @param listener - Command event listener
   * @event
   */
  removeListener(event: 'command', listener: (job: CommandJobHandler) => void): this;
  /**
   * Removes all listeners, or those of the specified event.
   * @param event - `command` event
   */
  removeAllListeners(event?: 'command'): this;
}

export class ServiceRegistry<
  CustomSettings extends Record<string, CustomSetting> = Record<string, CustomSetting>,
> extends EventEmitter {
  /** Service Settings manager */
  private readonly _settingsManager: SettingsManager<CustomSettings>;
  /** Resources attached to the service registry observability */
  private readonly _resources: Layer.Observable[] = [];
  /** Service Registry observability instance */
  private readonly _observability: Observability;
  /** Service Registry control manager */
  private readonly _consumer: ControlManager;
  /** Flag to indicate if the service has performed the bootstrap */
  private _booted = false;
  /** Flag to indicate if the service has started */
  private _started = false;
  /** Logger instance */
  private readonly _logger: LoggerInstance;
  /**
   * Create a new instance of the Service Registry
   * @param bootstrapOptions - Bootstrap settings, define how the Custom and the Service Registry
   * settings should be loaded.
   * @param serviceRegistryOptions - Service Registry settings, used as a base for the Service
   * Registry configuration manager.
   * @param customSettings - Custom settings provided by the user, used as a base for the Custom
   * configuration manager.
   */
  constructor(
    bootstrapOptions?: BootstrapOptions,
    serviceRegistryOptions?: ServiceRegistryOptions<CustomSettings>,
    customSettings?: Partial<CustomSettings>
  ) {
    super();
    this._settingsManager = new SettingsManager(
      bootstrapOptions,
      serviceRegistryOptions,
      customSettings
    );
    this._logger = SetContext(
      new Logger(this._settingsManager.name, this._settingsManager.logger),
      this._settingsManager.name,
      this._settingsManager.instanceId
    );
    this._observability = new Observability({
      ...this._settingsManager.observability,
      logger: this._logger,
    });
    this._consumer = new ControlManager(
      this._settingsManager.serviceRegistrySettings,
      this._logger,
      this.resolverMap
    );
    this._observability.attach(this._settingsManager);
    if (this._consumer.instance && !this._consumer.error && bootstrapOptions?.consumer) {
      this._consumer.on('command', this.onCommandEvent.bind(this));
      this._observability.attach(this._consumer.instance);
    } else if (this._consumer.error) {
      // Stryker disable next-line all
      this._logger.warn(
        'OpenC2 Consumer is not available, the service is not able to receive commands'
      );
      this._observability.push(this._consumer.error);
    }
    process.on('SIGINT', () => this.onFinishCommand('SIGINT'));
    process.on('SIGTERM', () => this.onFinishCommand('SIGTERM'));
  }
  /** @returns Default resolver map for the OpenC2 Consumer interface */
  private get resolverMap(): ResolverMap | undefined {
    if (this._settingsManager.namespace) {
      return {
        [`query:${this._settingsManager.namespace}:health`]: this.onHealthCommand.bind(this),
        [`query:${this._settingsManager.namespace}:stats`]: this.onStatsCommand.bind(this),
        [`query:${this._settingsManager.namespace}:errors`]: this.onErrorsCommand.bind(this),
        [`query:${this._settingsManager.namespace}:config`]: this.onConfigCommand.bind(this),
        [`start:${this._settingsManager.namespace}:resources`]: this.start.bind(this),
        [`stop:${this._settingsManager.namespace}:resources`]: this.stop.bind(this),
        [`restart:${this._settingsManager.namespace}:all`]: this.onFinishCommand.bind(
          this,
          'SIGINT'
        ),
      };
    } else {
      return undefined;
    }
  }
  /** Return the health information from the observability instance */
  private readonly onHealthCommand = async (): Promise<Layer.App.Health> => {
    return this._observability.health;
  };
  /** Return the service stats from the observability instance */
  private readonly onStatsCommand = async (): Promise<Metrics.Response> => {
    return this._observability.metrics;
  };
  /** Return the errors stored in the registry from the observability instance */
  private readonly onErrorsCommand = async (): Promise<ErrorRecord[]> => {
    return deCycle(this._observability.errors);
  };
  /** Return the custom settings from the configuration manager */
  private readonly onConfigCommand = async (): Promise<ServiceSetting<CustomSetting>> => {
    return this.settings;
  };
  /**
   * Perform the finish of the service engine and exit the process
   * @param signal - The signal received
   */
  private readonly onFinishCommand = async (signal: string): Promise<void> => {
    // Stryker disable next-line all
    this._logger.warn(`Received ${signal} signal, finishing application engine ...`);
    try {
      await this.shutdown();
      await this.stop();
    } catch (rawError) {
      const cause = Crash.from(rawError);
      this._logger.crash(cause);
    } finally {
      // Stryker disable next-line all
      this._logger.info(`Application engine finished`);
      setTimeout(process.exit, SHUTDOWN_DELAY, signal === 'SIGINT' ? 0 : 1);
    }
  };
  /** Handle the command event from the OpenC2 consumer */
  private readonly onCommandEvent = (command: CommandJobHandler): void => {
    this.emit('command', command);
  };
  /**
   * Wrap the start method of the resource to avoid errors
   * @param resource - the resource to be wrapped
   */
  private readonly wrappedStart = async (resource: Layer.Observable): Promise<void> => {
    if ('start' in resource && typeof resource.start === 'function') {
      await retryBind(resource.start, resource, [], this.retryOptions);
    } else {
      // Stryker disable next-line all
      this._logger.info(`${resource.name} has not a start method`);
      await Promise.resolve();
    }
  };
  /**
   * Wrap the stop method of the resource to avoid errors
   * @param resource - the resource to be wrapped
   * @returns
   */
  private readonly wrappedStop = async (resource: Layer.Observable): Promise<void> => {
    if ('stop' in resource && typeof resource.stop === 'function') {
      await retryBind(resource.stop, resource, [], this.retryOptions);
    } else {
      // Stryker disable next-line all
      this._logger.info(`${resource.name} has not a stop method`);
      await Promise.resolve();
    }
  };
  /** Perform the bootstrap of all the service registry resources */
  private readonly bootstrap = async (): Promise<void> => {
    try {
      if (this._booted) {
        return;
      }
      // Stryker disable next-line all
      this._logger.info(
        `Welcome to ${this._settingsManager.name} - ${this._settingsManager.release} - ${this._settingsManager.instanceId}`
      );
      // Stryker disable next-line all
      this._logger.info('Bootstrapping application engine ...');
      await retryBind(this._observability.start, this._observability, [], this.retryOptions);
      const links = JSON.stringify(this._observability.links, null, 2);
      // Stryker disable next-line all
      this._logger.info(`Observability engine started, the health information is at: ${links}`);
      if (this._consumer.instance) {
        await retryBind(this._consumer.start, this._consumer, [], this.retryOptions);
        // Stryker disable next-line all
        this._logger.info('OpenC2 Consumer engine started');
      }
      this._booted = true;
    } catch (rawError) {
      const cause = Crash.from(rawError);
      const error = new Crash(`Error bootstrapping the application engine: ${cause.message}`, {
        cause,
      });
      this._logger.crash(error);
      throw error;
    }
  };
  /** Perform the shutdown of all the service registry resources */
  private readonly shutdown = async (): Promise<void> => {
    try {
      if (!this._booted) {
        return;
      }
      // Stryker disable next-line all
      this._logger.info('Shutting down application engine ...');
      if (this._consumer.instance) {
        await retryBind(this._consumer.stop, this._consumer, [], this.retryOptions);
        // Stryker disable next-line all
        this._logger.info('OpenC2 Consumer engine stopped');
      }
      await retryBind(this._observability.stop, this._observability, [], this.retryOptions);
      // Stryker disable next-line all
      this._logger.info('Observability engine stopped');
      this._booted = false;
    } catch (rawError) {
      const cause = Crash.from(rawError);
      const error = new Crash(`Error shutting down the application engine: ${cause.message}`, {
        cause,
      });
      // Stryker disable next-line all
      this._logger.crash(error);
      throw error;
    }
  };
  /** @returns The retry options used for starting resources and service  */
  private get retryOptions(): RetryOptions | undefined {
    return {
      logger: this._logger.crash,
      ...this._settingsManager.retryOptions,
    };
  }
  /** @returns Service Register health information */
  public get errors(): ErrorRecord[] {
    return this._observability.errors;
  }
  /** @returns Service Register health information */
  public get health(): Layer.App.Health {
    return this._observability.health;
  }
  /** @returns Service Register status */
  public get status(): Health.Status {
    return this._observability.status;
  }
  /** @returns Service Register settings */
  public get serviceRegistrySettings(): ServiceRegistrySettings<CustomSettings> {
    return this._settingsManager.serviceRegistrySettings;
  }
  /** @returns Custom settings */
  public get customSettings(): CustomSettings {
    return this._settingsManager.customSettings;
  }
  /** @returns Service settings */
  public get settings(): ServiceSetting<CustomSetting> {
    return this._settingsManager.settings;
  }
  /**
   * Register a resource within the service observability
   * @param resource - The resource or resources to be register
   */
  public register(resource: Layer.Observable | Layer.Observable[]): void {
    const resources = Array.isArray(resource) ? resource : [resource];
    for (const entry of resources) {
      this._resources.push(entry);
      // Stryker disable next-line all
      this._logger.debug(`Registering resource: ${entry.name}`);
      this._observability.attach(entry);
    }
  }
  /**
   * Gets the value at path of object. If the resolved value is undefined, the defaultValue is
   * returned in its place.
   * @param path - path to the property to get
   * @param defaultValue - default value to return if the property is not found
   * @template T - Type of the property to return
   */
  public get<T>(path: string | string[], defaultValue?: T): T | undefined;
  /**
   * Gets the value at path of object. If the resolved value is undefined, the defaultValue is
   * returned in its place.
   * @param key - path to the property to get
   * @param defaultValue - default value to return if the property is not found
   */
  public get<P extends keyof CustomSettings>(
    key: P,
    defaultValue?: CustomSettings[P]
  ): CustomSettings[P] | undefined;
  public get<T>(path: string | string[], defaultValue?: CustomSetting): T | undefined {
    return this._settingsManager.customRegisterConfigManager.get(path, defaultValue);
  }
  /** Perform the initialization of all the service resources that has been attached */
  public readonly start = async (): Promise<void> => {
    try {
      if (this._started) {
        return;
      }
      if (!this._booted) {
        await this.bootstrap();
      }
      if (this._settingsManager.isPrimary) {
        // Stryker disable next-line all
        this._logger.info('Application resources are not started in the primary cluster node');
        this._started = true;
        return;
      }
      // Stryker disable next-line all
      this._logger.info('Starting application resources ...');
      for (const resource of this._resources) {
        // Stryker disable next-line all
        this._logger.info(`Starting resource: ${resource.name} ...`);
        await this.wrappedStart(resource);
        // Stryker disable next-line all
        this._logger.info(`... ${resource.name} started`);
      }
      // Stryker disable next-line all
      this._logger.info('... application resources started');
      this._started = true;
    } catch (rawError) {
      const cause = Crash.from(rawError);
      const error = new Crash(`Error starting the application resources: ${cause.message}`, {
        cause,
      });
      this._logger.crash(error);
      throw error;
    }
  };
  /** Perform the stop of all the service resources that has been attached */
  public readonly stop = async (): Promise<void> => {
    try {
      if (!this._started) {
        return;
      }
      if (this._booted) {
        await this.shutdown();
      }
      if (this._settingsManager.isPrimary) {
        // Stryker disable next-line all
        this._logger.info('Application resources are not stopped in the primary cluster node');
        this._started = false;
        return;
      }
      // Stryker disable next-line all
      this._logger.info('Stopping application resources ...');
      for (const resource of this._resources) {
        // Stryker disable next-line all
        this._logger.info(`Stopping resource: ${resource.name} ...`);
        await this.wrappedStop(resource);
        // Stryker disable next-line all
        this._logger.info(`... ${resource.name} stopped`);
      }
      // Stryker disable next-line all
      this._logger.info('... application resources stopped');
      this._started = false;
    } catch (rawError) {
      const cause = Crash.from(rawError);
      const error = new Crash(`Error stopping the application resources: ${cause.message}`, {
        cause,
      });
      // Stryker disable next-line all
      this._logger.crash(error);
      throw error;
    }
  };
}
