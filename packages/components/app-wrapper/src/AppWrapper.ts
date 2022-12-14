/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health, Layer } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { ErrorRecord } from '@mdf.js/error-registry';
import { Logger, LoggerInstance, SetContext } from '@mdf.js/logger';
import { MetricsResponse } from '@mdf.js/metrics-registry';
import { Observability } from '@mdf.js/observability';
import { Consumer, ConsumerOptions, Control, Factory, ResolverMap } from '@mdf.js/openc2';
import { retryBind } from '@mdf.js/utils';
import { merge } from 'lodash';
import { v4 } from 'uuid';
import { ApplicationWrapperOptions, ConsumerAdapterOptions } from './types';

export class AppWrapper {
  /** Instance identifier */
  public readonly instanceId = v4();
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
    private readonly options: ApplicationWrapperOptions,
    private readonly resources: Layer.App.Resource[] = []
  ) {
    this.logger = SetContext(
      new Logger(this.options.name, this.options.logger),
      'app',
      this.instanceId
    );
    this.observability = new Observability({
      ...this.options.application,
      ...this.options.observability,
      name: this.options.name,
      description: this.options.application?.description ?? this.options.name,
      release: this.options.application?.release ?? '1.0.0',
      version: this.options.application?.version ?? '1',
      instanceId: this.instanceId,
    });
    if (this.options.consumer) {
      this.consumer = this.createConsumer(
        {
          ...this.options.consumer,
          id: this.options.consumer?.id ?? this.options.name,
          resolver: this.resolverMap,
          actionTargetPairs: this.actionTargetPairs,
          logger: this.options.consumer?.logger ?? this.logger,
        },
        this.options.adapter
      );
      this.observability.attach(this.consumer);
      this.observability.healthRegistry.register(this.consumer);
    }
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
      return merge(defaultResolver, this.options.consumer?.resolver);
    } else {
      return this.options.consumer?.resolver;
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
      return merge(defaultPairs, this.options.consumer?.actionTargetPairs);
    } else if (this.options.consumer?.actionTargetPairs) {
      return this.options.consumer?.actionTargetPairs;
    } else {
      return {
        query: ['features'],
      };
    }
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
      await retryBind(resource.start, resource, [], this.options.retryOptions);
    } else {
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
      await retryBind(resource.stop, resource, [], this.options.retryOptions);
    } else {
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
      this.logger.debug(`Registering resource: ${entry.name}`);
      this.observability.healthRegistry.register(entry);
    }
  }
  /** Application name */
  public get name(): string {
    return this.options.name;
  }
  /** Application release */
  public get release(): string {
    return this.options.application?.release || '0.0.0';
  }
  /** Perform the shutdown of all the application resources */
  public readonly bootstrap = async (): Promise<void> => {
    try {
      if (this.booted) {
        return;
      }
      this.logger.info(`Welcome to ${this.name} - ${this.release} - ${this.instanceId}`);
      this.logger.info('Bootstrapping application engine ...');
      await retryBind(this.observability.start, this.observability, [], this.options.retryOptions);
      const links = JSON.stringify(this.observability.links, null, 2);
      this.logger.info(`Observability engine started, the health information is at: ${links}`);
      if (this.consumer) {
        await retryBind(this.consumer.start, this.consumer, [], this.options.retryOptions);
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
      this.logger.info('Starting application resources ...');
      for (const resource of this.resources) {
        this.logger.info(`Starting resource: ${resource.name} ...`);
        await this.wrappedStart(resource);
        this.logger.info(`... ${resource.name} started`);
      }
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
      this.logger.info('Shutting down application engine ...');
      if (this.consumer) {
        await retryBind(this.consumer.stop, this.consumer, [], this.options.retryOptions);
        this.logger.info('OpenC2 Consumer engine stopped');
      }
      await retryBind(this.observability.stop, this.observability, [], this.options.retryOptions);
      this.logger.info('Observability engine stopped');
      this.booted = false;
    } catch (rawError) {
      const cause = Crash.from(rawError);
      const error = new Crash(`Error shutting down the application engine: ${cause.message}`, {
        cause,
      });
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
      this.logger.info('Stopping application resources ...');
      for (const resource of this.resources) {
        this.logger.info(`Stopping resource: ${resource.name} ...`);
        await this.wrappedStop(resource);
        this.logger.info(`... ${resource.name} stopped`);
      }
      this.logger.info('... application resources stopped');
      this.started = false;
    } catch (rawError) {
      const cause = Crash.from(rawError);
      const error = new Crash(`Error stopping the application resources: ${cause.message}`, {
        cause,
      });
      this.logger.crash(error);
      throw error;
    }
  };
}
