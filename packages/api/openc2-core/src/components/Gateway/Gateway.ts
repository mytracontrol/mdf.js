/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health } from '@mdf.js/core';
import { Crash, Links } from '@mdf.js/crash';
import { DebugLogger, LoggerInstance, SetContext } from '@mdf.js/logger';
import EventEmitter from 'events';
import express from 'express';
import { cloneDeep } from 'lodash';
import { v4 } from 'uuid';
import { Accessors } from '../../helpers';
import { HealthWrapper, Registry } from '../../modules';
import { Router } from '../../Router';
import {
  CommandJobHandler,
  ConsumerAdapter,
  Control,
  GatewayOptions,
  ProducerAdapter,
} from '../../types';
import { Consumer } from '../Consumer';
import { Producer } from '../Producer';
import { ConsumerMap } from '../Producer/ConsumerMap';

const MIN_LOOKUP_INTERVAL = 10000;
const AGING_INTERVAL_FACTOR = 3;
const MAX_AGED_FACTOR = 3;
const MIN_GATEWAY_DELAY = 1000;

interface GatewayTimers {
  lookupInterval: number;
  lookupTimeout: number;
  agingInterval: number;
  maxAge: number;
  delay: number;
}
export declare interface Gateway {
  /** Emitted when a consumer's operation has some error */
  on(event: 'error', listener: (error: Crash | Error) => void): this;
  /** Emitted on every state change */
  on(event: 'status', listener: (status: Health.API.Status) => void): this;
}

export class Gateway extends EventEmitter implements Health.Component, Health.Service {
  /** Component identification */
  public readonly componentId: string = v4();
  /** Component commands and message register */
  protected readonly register: Registry;
  /** Health wrapper instance */
  private readonly health: HealthWrapper;
  /** Logger instance */
  private readonly logger: LoggerInstance;
  /** Component started flag */
  private started: boolean;
  /** Upstream Consumer */
  private readonly consumer: Consumer;
  /** Downstream Producer */
  private readonly producer: Producer;
  /** Registry router */
  private readonly _router: Router;
  /**
   * Regular OpenC2 gateway implementation.
   * @param upstream - upstream consumer adapter interface
   * @param downstream - downstream producer adapter interface
   * @param options - configuration options
   */
  constructor(
    upstream: ConsumerAdapter,
    downstream: ProducerAdapter,
    private readonly options: GatewayOptions
  ) {
    super();
    this.logger = SetContext(
      this.options.logger ?? new DebugLogger(`oc2:gateway:${this.name}`),
      this.constructor.name,
      this.componentId
    );
    this.register =
      this.options.registry ??
      new Registry(this.options.id, this.options.maxInactivityTime, this.options.registerLimit);
    this._router = new Router(this.register);
    this.consumer = new Consumer(upstream, { ...this.options, registry: this.register });
    this.producer = new Producer(downstream, {
      ...this.options,
      ...(this.options.bypassLookupIntervalChecks ? {} : this.checkLookupTimes(this.options)),
      registry: this.register,
    });
    this.health = new HealthWrapper(this.options.id, [this.consumer, this.producer]);
    this.consumer.on('command', this.onUpstreamCommandHandler);
    this.producer.consumerMap.on('updated', this.updateConsumerOptions);
    this.started = false;
    // Stryker disable next-line all
    this.logger.debug(`OpenC2 Gateway created - [${options.id}]`);
  }
  /** Component name */
  public get name(): string {
    return this.options.id;
  }
  /**
   * Return the status of the Consumer in a standard format
   * @returns _check object_ as defined in the draft standard
   * https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check-05
   */
  public get checks(): Health.API.Checks {
    return this.health.checks;
  }
  /** Return an Express router with access to errors registry */
  public get router(): express.Router {
    return this._router.router;
  }
  /** Return links offered by this service */
  public get links(): Links {
    return {
      openc2: {
        jobs: '/openc2/jobs',
        pendingJobs: '/openc2/pendingJobs',
        messages: '/openc2/messages',
      },
    };
  }
  /** Connect the OpenC2 underlayer component and perform the startup of the component */
  public start(): Promise<void> {
    if (this.started) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      this.producer
        .start()
        .then(() => this.consumer.start())
        .then(() => {
          this.health.on('error', this.onErrorHandler);
          this.health.on('status', this.onStatusHandler);
        })
        .then(() => {
          this.started = true;
          resolve();
        })
        .catch(reject);
    });
  }
  /** Disconnect the OpenC2 underlayer component and perform the startup of the component */
  public stop(): Promise<void> {
    if (!this.started) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      this.health.off('error', this.onErrorHandler);
      this.health.off('status', this.onStatusHandler);
      this.consumer
        .stop()
        .then(() => this.producer.stop())
        .then(() => {
          this.started = false;
          resolve();
        })
        .catch(reject);
    });
  }
  /** Consumer Map */
  public get consumerMap(): ConsumerMap {
    return this.producer.consumerMap;
  }
  /**
   * Check the lookup time fix them if area wrong
   * @param options - configuration options
   * @returns
   */
  private checkLookupTimes(options: GatewayOptions): GatewayTimers {
    const lookupInterval = this.isHigherThan(MIN_LOOKUP_INTERVAL, options.lookupInterval);
    const lookupTimeout = this.isLowerThan(lookupInterval / 2, options.lookupTimeout);
    const agingInterval = this.isHigherThan(
      lookupInterval * AGING_INTERVAL_FACTOR,
      options.agingInterval
    );
    const maxAge = this.isHigherThan(agingInterval * MAX_AGED_FACTOR, options.maxAge);
    const delay = this.isHigherThan(MIN_GATEWAY_DELAY, options.delay);
    const selectedOptions = {
      lookupInterval,
      lookupTimeout,
      agingInterval,
      maxAge,
      delay,
    };
    // Stryker disable next-line all
    this.logger.debug(`Gateway options ${JSON.stringify(selectedOptions, null, 2)}`);
    return selectedOptions;
  }
  /**
   * Check if the value is higher than the limit, it not returns the limit
   * @param value - value to be checked
   * @param limit - limit
   * @returns
   */
  private isHigherThan(limit: number, value?: number): number {
    return value && value > limit ? value : limit;
  }
  /**
   * Check if the value is lower than the limit, it not returns the limit
   * @param value - value to be checked
   * @param limit - limit
   * @returns
   */
  private isLowerThan(limit: number, value?: number): number {
    return value && value < limit ? value : limit;
  }
  /**
   * Forward the command to the downstream producer
   * @param job - job to be processed
   */
  private readonly onUpstreamCommandHandler = (job: CommandJobHandler): void => {
    // Stryker disable all
    this.logger.debug(`Received command from upstream: ${job.data.request_id}`);
    this.logger.silly(`Direction: ${job.data.from} - ${job.data.to}`);
    this.logger.silly(
      `Command: ${job.data.content.action} - ${JSON.stringify(job.data.content.target, null, 2)}`
    );
    // Stryker enable all
    let adaptedCommand: Control.CommandMessage;
    try {
      adaptedCommand = this.adaptCommand(job.data);
    } catch (rawError) {
      const error = Crash.from(rawError);
      // Stryker disable next-line all
      this.logger.error(`Error adapting command: ${error.message}`);
      job.done(error as Crash);
      return;
    }
    this.producer
      .command(adaptedCommand)
      .then(responses => {
        for (const response of responses) {
          // Stryker disable all
          this.logger.debug(`Command response: ${response.request_id}`);
          this.logger.silly(`Direction: ${response.from} - ${job.data.to}`);
          this.logger.silly(`Command: ${response.content.results?.pairs}`);
          // Stryker enable all
        }
        job.done();
      })
      .catch(job.done);
  };
  /**
   * Adapt the command to be forwarded
   * @param command - command to be processed
   * @returns
   */
  private adaptCommand(command: Control.CommandMessage): Control.CommandMessage {
    const adaptedCommand = cloneDeep(command);
    adaptedCommand.from = this.options.id;
    adaptedCommand.to = this.getForwardAddresses(command);
    adaptedCommand.content.args = this.getArgs(command);
    return adaptedCommand;
  }
  /**
   * Get the update args for command execution
   * @param command - command to be processed
   * @returns
   */
  private getArgs(command: Control.CommandMessage): Control.Arguments {
    const actualDelay = Accessors.getDelayFromCommandMessage(command);
    if (actualDelay - (this.options.delay || MIN_GATEWAY_DELAY) > 0) {
      return {
        start_time: command.content.args?.start_time,
        stop_time: undefined,
        duration: actualDelay - (this.options.delay || MIN_GATEWAY_DELAY),
        response_requested: command.content.args?.response_requested,
      };
    } else {
      const error = new Crash(
        `No enough time to perform the forwarding of the command`,
        this.componentId,
        { info: { command, subject: 'OpenC2 Gateway' } }
      );
      this.onErrorHandler(error);
      throw error;
    }
  }
  /**
   * Get the addresses to forward the command
   * @param command - command to be forwarded
   * @returns
   */
  private getForwardAddresses(command: Control.CommandMessage): string[] {
    const action = Accessors.getActionFromCommand(command.content);
    const target = Accessors.getTargetFromCommand(command.content);
    const profile = target.split(':')[0];
    const destinations: string[] = this.producer.consumerMap.getConsumersWithPair(action, target);
    const actuator = Accessors.getActuatorAssetId(command.content, profile);

    if (command.to.includes('*')) {
      return ['*'];
    } else if (actuator) {
      return [actuator];
    } else if (destinations.length > 0) {
      return destinations;
    } else {
      const error = new Crash(`No valid destination found for this command`, this.componentId, {
        info: { command, subject: 'OpenC2 Gateway' },
      });
      this.onErrorHandler(error);
      throw error;
    }
  }
  /** Update the features of the upstream consumer based in the upstream consumer map */
  private readonly updateConsumerOptions = () => {
    const { pairs, profiles } = this.producer.consumerMap.getGroupedFeatures();
    this.consumer.pairs = pairs;
    this.consumer.profiles = profiles;
  };
  /**
   * Manage the error in the producer interface
   * @param error - error to be processed
   */
  protected onErrorHandler(error: unknown): void {
    const crash = Crash.from(error);
    this.logger.crash(crash);
    if (this.listenerCount('error') > 0) {
      this.emit('error', crash);
    }
  }
  /**
   * Manage the status change in the producer interface
   * @param status - status to be processed
   */
  private onStatusHandler(status: Health.API.Status): void {
    if (this.listenerCount('status') > 0) {
      this.emit('status', status);
    }
  }
}
