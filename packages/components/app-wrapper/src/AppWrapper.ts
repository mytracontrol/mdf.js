/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health, Layer } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { ErrorRecord } from '@mdf.js/error-registry';
import { Logger, LoggerConfig, LoggerInstance, SetContext } from '@mdf.js/logger';
import { MetricsResponse } from '@mdf.js/metrics-registry';
import { Observability, ObservabilityOptions } from '@mdf.js/observability';
import { Consumer, ConsumerOptions, Control, Factory, ResolverMap } from '@mdf.js/openc2';
import { ConfigManager, Setup } from '@mdf.js/service-setup-provider';
import { RetryOptions, retryBind } from '@mdf.js/utils';
import { MergeWithCustomizer, cloneDeep, merge, mergeWith } from 'lodash';
import { v4 } from 'uuid';
import { ApplicationWrapperOptions, ConsumerAdapterOptions } from './types';

const customizer: MergeWithCustomizer = (objValue, srcValue) => {
  if (Array.isArray(objValue)) {
    return Array.from(new Set(objValue.concat(srcValue)).values());
  }
  return undefined;
};

type InternalSetupConfig = Partial<Omit<ApplicationWrapperOptions, 'setup'>>;
const SHUTDOWN_DELAY = 1000;
const INTERNAL_OPTIONS = [
  'name',
  'setup',
  'application',
  'namespace',
  'observability',
  'logger',
  'consumer',
  'adapter',
  'retryOptions',
];

export class AppWrapper<AppConfig extends Record<string, any> = Record<string, any>> {
  /** Instance identifier */
  public readonly instanceId = v4();
  /** Application setup provider */
  private readonly setupProvider: Setup.Provider;
  /** Application setup config */
  private readonly internalSetup: Setup.Client<InternalSetupConfig & AppConfig>;
  /** Observability instance */
  public readonly observability: Observability;
  /** Logger instance */
  public readonly logger: LoggerInstance;
  /** Consumer instance */
  public readonly consumer?: Consumer;
  /** The application wrapped has performed the bootstrap */
  private booted = false;
  /** The application wrapped has been started */
  private started = false;
  /**
   * Create a new instance of the application wrapper
   * @param options - Application wrapper options
   * @param resources - Application resources
   */
  constructor(
    private readonly options: ApplicationWrapperOptions = {},
    private readonly resources: Layer.App.Resource[] = []
  ) {
    this.setupProvider = Setup.Factory.create({
      name: this.options.name,
      config: this.setupConfig,
      useEnvironment: 'CONFIG_SERVICE_SETUP_',
    });
    this.internalSetup = this.setupProvider.client as ConfigManager<
      ApplicationWrapperOptions & AppConfig
    >;
    this.logger = SetContext(new Logger(this.name, this.loggerConfig), 'app', this.instanceId);
    this.observability = new Observability(this.observabilityConfig);
    if (this.options.consumer) {
      this.consumer = this.createConsumer(this.consumerConfig, this.openC2AdapterConfig);
      this.observability.attach(this.consumer);
      this.observability.healthRegistry.register(this.consumer);
    }
    this.observability.attach(this.internalSetup);
    process.on('SIGINT', () => this.finish('SIGINT'));
    process.on('SIGTERM', () => this.finish('SIGTERM'));
  }
  /**
   * Create the consumer based on the configuration options
   * @param consumerOptions - Consumer options
   * @param adapterOptions - Consumer adapter options
   */
  private createConsumer(
    consumerOptions: ConsumerOptions,
    adapterOptions?: ConsumerAdapterOptions
  ): Consumer {
    if (!adapterOptions || adapterOptions.type === 'redis') {
      return Factory.Consumer.Redis(
        consumerOptions,
        adapterOptions ? adapterOptions.config : undefined
      );
    } else if (adapterOptions.type === 'socketIO') {
      return Factory.Consumer.SocketIO(consumerOptions, adapterOptions.config);
    } else {
      //@ts-ignore - This is a type guard
      throw new Crash(`Unknown consumer adapter type: ${adapterOptions.type}`);
    }
  }
  /** Get the application name */
  private get name(): string {
    return this.options.name || this.internalSetup.config.name || 'app-wrapper';
  }
  /** Get the application description */
  private get description(): string {
    return (
      this.options.application?.description ||
      this.internalSetup.config.application?.description ||
      this.name
    );
  }
  /** Get the Setup configuration options */
  private get setupConfig(): Setup.Config {
    return merge(this.options.setup, {
      name: this.options.name,
      envPrefix: {
        application: 'CONFIG_APPLICATION_',
        observability: 'CONFIG_OBSERVABILITY_',
        logger: 'CONFIG_LOGGER_',
        consumer: 'CONFIG_OC2_CONSUMER_',
        retryOptions: 'CONFIG_RETRY_OPTIONS_',
      },
    });
  }
  /** Get the logger configuration options */
  private get loggerConfig(): LoggerConfig | undefined {
    return merge(cloneDeep(this.options.logger), this.internalSetup.config.logger);
  }
  /** Get the observability configuration options */
  private get observabilityConfig(): ObservabilityOptions {
    const version = this.options.application?.version || this.release.split('.')[0] || '1';
    const config = {
      ...this.options.application,
      ...this.options.observability,
      name: this.name,
      description: this.description,
      release: this.release,
      version,
      instanceId: this.instanceId,
    };
    return merge(
      config,
      this.internalSetup.config.observability,
      this.internalSetup.config.application
    );
  }
  /** Get the OpenC2 consumer options */
  private get consumerConfig(): ConsumerOptions {
    return merge(cloneDeep(this.options.consumer), this.internalSetup.config.consumer, {
      id: this.options.consumer?.id ?? this.name,
      resolver: this.resolverMap,
      actionTargetPairs: this.actionTargetPairs,
      logger: this.options.consumer?.logger ?? this.logger,
    });
  }
  /** Get the resolver map for the OpenC2 interface */
  private get resolverMap(): ResolverMap | undefined {
    if (this.options.namespace) {
      const defaultResolver = {
        [`query:${this.options.namespace}:health`]: this.health,
        [`query:${this.options.namespace}:stats`]: this.stats,
        [`query:${this.options.namespace}:errors`]: this.errors,
        [`start:${this.options.namespace}:resources`]: this.start,
        [`stop:${this.options.namespace}:resources`]: this.stop,
      };
      return merge(
        defaultResolver,
        this.options.consumer?.resolver,
        this.internalSetup.config.consumer?.resolver
      );
    } else {
      return merge(
        cloneDeep(this.options.consumer?.resolver),
        this.internalSetup.config.consumer?.resolver
      );
    }
  }
  /** Get the action-target pairs map for the OpenC2 interface */
  private get actionTargetPairs(): Control.ActionTargetPairs {
    if (this.options.namespace) {
      const defaultPairs = {
        query: [
          'features',
          `${this.options.namespace}:health`,
          `${this.options.namespace}:stats`,
          `${this.options.namespace}:errors`,
        ],
        start: [`${this.options.namespace}:resources`],
        stop: [`${this.options.namespace}:resources`],
      };
      return mergeWith(
        defaultPairs,
        this.options.consumer?.actionTargetPairs,
        this.internalSetup.config.consumer?.actionTargetPairs,
        customizer
      );
    } else if (this.options.consumer?.actionTargetPairs) {
      return this.options.consumer?.actionTargetPairs;
    } else {
      return merge(
        {
          query: ['features'],
        },
        this.options.consumer?.actionTargetPairs,
        this.internalSetup.config.consumer?.actionTargetPairs
      );
    }
  }
  /** Get the OpenC2 adapter options */
  private get openC2AdapterConfig(): ConsumerAdapterOptions | undefined {
    if (!this.options.adapter && !this.internalSetup.config.adapter) {
      return undefined;
    }
    return merge(cloneDeep(this.options.adapter), this.internalSetup.config.adapter);
  }
  /** Get the retry options */
  private get retryOptions(): RetryOptions | undefined {
    if (!this.options.retryOptions && !this.internalSetup.config.retryOptions) {
      return undefined;
    }
    return merge(cloneDeep(this.options.retryOptions), this.internalSetup.config.retryOptions);
  }
  /** Return the health information from the observability instance */
  private readonly health = async (): Promise<Health.AppHealth> => {
    return Promise.resolve(this.observability.healthRegistry.health);
  };
  /** Return the application stats from the observability instance */
  private readonly stats = async (): Promise<MetricsResponse> => {
    return this.observability.metricsRegistry.metricsJSON();
  };
  /** Return the error registry from the observability instance */
  private readonly errors = async (): Promise<ErrorRecord[]> => {
    return Promise.resolve(this.observability.errorsRegistry.errors);
  };
  /**
   * Wrap the start method of the resource to avoid errors
   * @param resource - the resource to be wrapped
   */
  private readonly wrappedStart = async (resource: Layer.App.Resource): Promise<void> => {
    if (typeof resource.start === 'function') {
      await retryBind(resource.start, resource, [], this.retryOptions);
    } else {
      // Stryker disable next-line all
      this.logger.info(`${resource.name} has not a start method`);
      await Promise.resolve();
    }
  };
  /**
   * Wrap the stop method of the resource to avoid errors
   * @param resource - the resource to be wrapped
   * @returns
   */
  private readonly wrappedStop = async (resource: Layer.App.Resource): Promise<void> => {
    if (typeof resource.stop === 'function') {
      await retryBind(resource.stop, resource, [], this.retryOptions);
    } else {
      // Stryker disable next-line all
      this.logger.info(`${resource.name} has not a stop method`);
      await Promise.resolve();
    }
  };
  /**
   * Register a resource within the application
   * @param resource - The resource or resources to be register
   */
  public register(resource: Layer.App.Resource | Layer.App.Resource[]): void {
    const resources = Array.isArray(resource) ? resource : [resource];
    this.resources.push(...resources);
    for (const entry of resources) {
      // Stryker disable next-line all
      this.logger.debug(`Registering resource: ${entry.name}`);
      this.observability.healthRegistry.register(entry);
    }
  }
  /** Application release */
  public get release(): string {
    return this.options.application?.release || this.internalSetup.package?.version || '1.0.0';
  }
  /**
   * Return the specific application configuration, this means everything except internal config
   * objects
   */
  public get setup(): AppConfig {
    const config: { [x: string]: any } = {};
    for (const [key, value] of Object.entries(this.internalSetup.config)) {
      if (!INTERNAL_OPTIONS.includes(key)) {
        config[key] = value;
      }
    }
    return config as AppConfig;
  }
  /**
   * Perform the finish of the application engine and exit the process
   * @param signal - The signal received
   */
  private readonly finish = async (signal: string): Promise<void> => {
    // Stryker disable next-line all
    this.logger.warn(`Received ${signal} signal, finishing application engine ...`);
    try {
      await this.shutdown();
    } catch (rawError) {
      const cause = Crash.from(rawError);
      this.logger.crash(cause);
    } finally {
      // Stryker disable next-line all
      this.logger.info(`Application engine finished`);
      setTimeout(process.exit, SHUTDOWN_DELAY, signal === 'SIGINT' ? 0 : 1);
    }
  };
  /** Perform the shutdown of all the application resources */
  public readonly bootstrap = async (): Promise<void> => {
    try {
      if (this.booted) {
        return;
      }
      // Stryker disable next-line all
      this.logger.info(`Welcome to ${this.name} - ${this.release} - ${this.instanceId}`);
      // Stryker disable next-line all
      this.logger.info('Bootstrapping application engine ...');
      await retryBind(this.observability.start, this.observability, [], this.retryOptions);
      const links = JSON.stringify(this.observability.links, null, 2);
      // Stryker disable next-line all
      this.logger.info(`Observability engine started, the health information is at: ${links}`);
      if (this.consumer) {
        await retryBind(this.consumer.start, this.consumer, [], this.retryOptions);
        // Stryker disable next-line all
        this.logger.info('OpenC2 Consumer engine started');
      }
      this.booted = true;
    } catch (rawError) {
      const cause = Crash.from(rawError);
      const error = new Crash(`Error bootstrapping the application engine: ${cause.message}`, {
        cause,
      });
      this.logger.crash(error);
      throw error;
    }
  };
  /** Perform the initialization of all the application resources */
  public readonly start = async (): Promise<void> => {
    try {
      if (this.started) {
        return;
      }
      if (!this.booted) {
        await this.bootstrap();
      }
      // Stryker disable next-line all
      this.logger.info('Starting application resources ...');
      for (const resource of this.resources) {
        // Stryker disable next-line all
        this.logger.info(`Starting resource: ${resource.name} ...`);
        await this.wrappedStart(resource);
        // Stryker disable next-line all
        this.logger.info(`... ${resource.name} started`);
      }
      // Stryker disable next-line all
      this.logger.info('... application resources started');
      this.started = true;
    } catch (rawError) {
      const cause = Crash.from(rawError);
      const error = new Crash(`Error starting the application resources: ${cause.message}`, {
        cause,
      });
      this.logger.crash(error);
      throw error;
    }
  };
  /** Perform the shutdown of all the application resources */
  public readonly shutdown = async (): Promise<void> => {
    try {
      if (!this.booted) {
        return;
      }
      // Stryker disable next-line all
      this.logger.info('Shutting down application engine ...');
      if (this.consumer) {
        await retryBind(this.consumer.stop, this.consumer, [], this.retryOptions);
        // Stryker disable next-line all
        this.logger.info('OpenC2 Consumer engine stopped');
      }
      await retryBind(this.observability.stop, this.observability, [], this.retryOptions);
      // Stryker disable next-line all
      this.logger.info('Observability engine stopped');
      this.booted = false;
    } catch (rawError) {
      const cause = Crash.from(rawError);
      const error = new Crash(`Error shutting down the application engine: ${cause.message}`, {
        cause,
      });
      // Stryker disable next-line all
      this.logger.crash(error);
      throw error;
    }
  };
  /** Perform the stop of all the application resources */
  public readonly stop = async (): Promise<void> => {
    try {
      if (!this.started) {
        return;
      }
      if (this.booted) {
        await this.shutdown();
      }
      // Stryker disable next-line all
      this.logger.info('Stopping application resources ...');
      for (const resource of this.resources) {
        // Stryker disable next-line all
        this.logger.info(`Stopping resource: ${resource.name} ...`);
        await this.wrappedStop(resource);
        // Stryker disable next-line all
        this.logger.info(`... ${resource.name} stopped`);
      }
      // Stryker disable next-line all
      this.logger.info('... application resources stopped');
      this.started = false;
    } catch (rawError) {
      const cause = Crash.from(rawError);
      const error = new Crash(`Error stopping the application resources: ${cause.message}`, {
        cause,
      });
      // Stryker disable next-line all
      this.logger.crash(error);
      throw error;
    }
  };
}
