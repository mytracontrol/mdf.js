/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { DebugLogger, LoggerInstance, SetContext } from '@mdf.js/logger';
import { EventEmitter } from 'events';
import {
  Admin,
  GroupDescription,
  InstrumentationEvent,
  ITopicMetadata,
  Kafka,
  KafkaConfig,
  logCreator,
  LogEntry,
  logLevel,
} from 'kafkajs';
import { inspect } from 'util';
import { v4 } from 'uuid';

export { KafkaConfig as KafkaClientOptions, logLevel } from 'kafkajs';

const DEFAULT_CHECK_INTERVAL = 30000;

export type SystemStatus = { topics: ITopicMetadata[]; groups: GroupDescription[] };

export declare interface Client {
  /** Emitted if admin client cloud not get metadata from brokers */
  on(event: 'unhealthy', listener: (crash: Crash) => void): this;
  /** Emitted every time that admin client get metadata from brokers */
  on(event: 'healthy', listener: (status: SystemStatus) => void): this;
}

/**
 * This client is based in the functionality of [kafkajs](https://kafka.js.org) for NodeJS.
 * In the moment of implement the port, this library show some issues and not clear API about how
 * the connection handshake and events are managed by the library, for this reason we decide to
 * include an admin client in all the cases, even when we only want to stablish a consumer or
 * producer.
 */
export abstract class Client extends EventEmitter {
  /** Debug logger for development and deep troubleshooting */
  protected readonly logger: LoggerInstance;
  /** Instance identification */
  protected readonly componentId = v4();
  /** Kafka Broker configuration options */
  readonly options: KafkaConfig;
  /** Kafka Client */
  protected readonly client: Kafka;
  /** Kafka admin instance */
  private _adminClient?: Admin;
  /** Period of check interval */
  private readonly interval: number;
  /** Check interval */
  private timeInterval?: NodeJS.Timeout;
  /** System status */
  private status: SystemStatus = { topics: [], groups: [] };
  /** Connection state flag */
  connected: boolean;
  /** Healthy flag, resumed state of brokers system */
  private healthy: boolean;
  /**
   * Create an instance of a Kafka client configuration options
   * @param options - Kafka client configuration options
   */
  constructor(options: KafkaConfig) {
    super();
    this.logger = SetContext(new DebugLogger('client:kafka'), 'kafka', this.componentId);
    // Stryker disable next-line all
    this.logger.debug(`New instance of Kafka Client created: ${this.componentId}`);
    this.options = { ...options, logCreator: options.logCreator ?? this.defaultLogCreator };
    this.interval = Math.floor((this.options.requestTimeout || DEFAULT_CHECK_INTERVAL) * 1.1);
    this.client = new Kafka(this.options);
    this.connected = false;
    this.healthy = false;
  }
  /** Overall client state */
  public get state(): boolean {
    return this.connected && this.healthy;
  }
  /**
   * Log creator function, used to log kafka events
   * @param level - configured log level
   * @returns
   */
  private readonly defaultLogCreator: logCreator = (logLevel: logLevel) => (entry: LogEntry) => {
    const { logger, message, ...others } = entry.log;
    const logMessage = `${logger} - ${entry.label} - ${entry.namespace} - ${message}`;
    this.logger.debug(logMessage);
    if (others) {
      this.logger.silly(JSON.stringify(others, null, 2));
    }
  };
  /** Perform the connection of the instance to the system */
  protected async start(): Promise<void> {
    if (this.connected) {
      return;
    }
    if (!this._adminClient) {
      this._adminClient = this.createAdmin();
    }
    try {
      await this._adminClient.connect();
      this.connected = true;
      if (!this.timeInterval) {
        this.timeInterval = setInterval(this.checkHealth, this.interval);
        this.checkHealth();
      }
    } catch (error) {
      const cause = Crash.from(error, this.componentId);
      throw new Crash(`Error in initial connection process: ${cause.message}`, this.componentId, {
        cause,
      });
    }
  }
  /** Perform the disconnection of the instance from the system */
  protected async stop(): Promise<void> {
    if (!this._adminClient || !this.connected) {
      return;
    }
    try {
      if (this.timeInterval) {
        clearInterval(this.timeInterval);
        this.timeInterval = undefined;
      }
      await this._adminClient.disconnect();
      this.connected = false;
    } catch (error) {
      const cause = Crash.from(error, this.componentId);
      throw new Crash(`Error in disconnection process: ${cause.message}`, this.componentId, {
        cause,
      });
    }
  }
  /**
   * Create an admin client over the underlayer Kafka client and perform the instrumentation of the
   * events
   */
  private createAdmin(): Admin {
    const admin = this.client.admin();
    for (const event of Object.values(admin.events)) {
      admin.on(event, this.eventLogging);
    }
    return admin;
  }
  /** Check the state of the topics over the brokers */
  private readonly checkHealth = (): void => {
    // Stryker disable next-line all
    this.logger.debug(`Checking the state of the topics...`);
    if (!this._adminClient) {
      this.status = { topics: [], groups: [] };
      this.emit('unhealthy', new Crash('Admin client not initialized', this.componentId));
      return;
    }
    this._adminClient
      .fetchTopicMetadata()
      .then(result => {
        this.status.topics = result.topics.filter(entry => !entry.name.startsWith('__'));
      })
      .then(() => this._adminClient?.listGroups())
      .then(result => {
        return !result || result.groups.length === 0
          ? undefined
          : this._adminClient?.describeGroups(result.groups.map(entry => entry.groupId));
      })
      .then(result => {
        if (result) {
          this.status.groups = result.groups.map(group => {
            //@ts-ignore Buffer kind information not give us any real understanding
            group.members = group.members.map(member => {
              return {
                memberId: member.memberId,
                clientId: member.clientId,
                clientHost: member.clientHost,
              };
            });
            return group;
          });
        }
        this.logger.silly(`STATUS: ${JSON.stringify(this.status, null, 2)}`);
        this.emit('healthy', this.status);
      })
      .catch(cause => {
        const crash = new Crash(`Error checking the system: ${cause.message}`, this.componentId, {
          cause,
        });
        this.logger.error(crash.message);
        this.healthy = false;
        this.status = { topics: [], groups: [] };
        this.emit('unhealthy', crash);
      });
  };
  /**
   * Log an event using the DEBUG logger for troubleshooting
   * @param context - event context
   */
  protected eventLogging = (context: InstrumentationEvent<unknown>): void => {
    const { type, timestamp, payload, id } = context;
    const date = new Date(timestamp).toISOString();
    // Stryker disable next-line all
    this.logger.debug(`[${type}] event in client with [${id}] at [${date}]`);
    if (payload) {
      // Stryker disable next-line all
      this.logger.silly(inspect(payload, false, 6));
    }
  };
  /**
   * Always retry to perform the process on failure function
   * @param cause - source of the failure
   */
  protected onFailure = async (cause: Error): Promise<boolean> => {
    const error = Crash.from(cause, this.componentId);
    // Stryker disable next-line all
    this.logger.error(`Retry failure for [${error.name}] ${error.message}`);
    this.emit('error', error);
    return true;
  };
}
