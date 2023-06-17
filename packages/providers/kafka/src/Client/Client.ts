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
  ITopicMetadata,
  InstrumentationEvent,
  Kafka,
  KafkaConfig,
  LogEntry,
  logCreator,
} from 'kafkajs';
import { inspect } from 'util';
import { v4 } from 'uuid';

export { KafkaConfig as KafkaClientOptions, logLevel } from 'kafkajs';

const DEFAULT_CHECK_INTERVAL = 30000;

export type SystemStatus = { topics: ITopicMetadata[]; groups: GroupDescription[] };

export declare interface Client {
  /** Emitted when admin client can collect the desired information */
  on(event: 'healthy', listener: () => void): this;
  /** Emitted when admin client can not collect the desired information */
  on(event: 'unhealthy', listener: (crash: Crash) => void): this;
  /** Emitted every time that admin client get metadata from brokers */
  on(event: 'status', listener: (status?: SystemStatus) => void): this;
  /** Emitted when admin client has some problem getting the metadata from brokers */
  on(event: 'error', listener: (crash: Crash) => void): this;
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
  protected readonly instance: Kafka;
  /** Kafka admin instance */
  private readonly admin: Admin;
  /** Check interval */
  private timeInterval?: NodeJS.Timeout;
  /** System status */
  private status: SystemStatus | undefined = undefined;
  /** Connection state flag */
  protected connected: boolean;
  /** Healthy flag, resumed state of brokers system */
  protected healthy: boolean;
  /** First check flag */
  private isFirstCheck = true;
  /**
   * Create an instance of a Kafka client configuration options
   * @param options - Kafka client configuration options
   * @param interval - Period of health check interval
   */
  constructor(options: KafkaConfig, private readonly interval = DEFAULT_CHECK_INTERVAL) {
    super();
    this.logger = SetContext(new DebugLogger('mdf:client:kafka'), 'kafka', this.componentId);
    // Stryker disable next-line all
    this.logger.debug(`New instance of Kafka Client created: ${this.componentId}`);
    this.options = { ...options, logCreator: options.logCreator ?? this.defaultLogCreator };
    this.interval = Math.floor((this.options.requestTimeout || interval) * 1.1);
    this.instance = new Kafka(this.options);
    this.admin = this.instance.admin();
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
  private readonly defaultLogCreator: logCreator = () => (entry: LogEntry) => {
    const { logger, message, ...others } = entry.log;
    const logMessage = `${logger} - ${entry.label} - ${entry.namespace} - ${message}`;
    this.logger.debug(logMessage);
    if (others) {
      this.logger.silly(inspect(others, false, 6));
    }
  };
  /** Perform the connection of the instance to the system */
  protected async start(): Promise<void> {
    if (this.connected) {
      return;
    }
    try {
      await this.admin.connect();
      for (const event of Object.values(this.admin.events)) {
        this.admin.on(event, this.eventLogging);
      }
      this.connected = true;
      if (!this.timeInterval) {
        this.timeInterval = setInterval(this.checkHealth, this.interval);
        await this.checkHealth();
      }
    } catch (error) {
      const cause = Crash.from(error, this.componentId);
      throw new Crash(`Error setting the monitoring client: ${cause.message}`, this.componentId, {
        cause,
      });
    }
  }
  /** Perform the disconnection of the instance from the system */
  protected async stop(): Promise<void> {
    if (!this.connected) {
      return;
    }
    try {
      if (this.timeInterval) {
        clearInterval(this.timeInterval);
        this.timeInterval = undefined;
      }
      await this.admin.disconnect();
      this.connected = false;
    } catch (error) {
      const cause = Crash.from(error, this.componentId);
      throw new Crash(
        `Error in disconnection process of monitor client: ${cause.message}`,
        this.componentId,
        { cause }
      );
    }
  }
  /** Check the state of the topics over the brokers */
  private readonly checkHealth = async (): Promise<void> => {
    // Stryker disable next-line all
    this.logger.debug(`Checking the state of the topics...`);
    this.status = { topics: [], groups: [] };
    try {
      const fetchedTopics = await this.admin.fetchTopicMetadata();
      this.status.topics = fetchedTopics.topics.filter(entry => !entry.name.startsWith('__'));
      this.status.groups = [];
      const fetchedGroups = await this.admin.listGroups();
      if (fetchedGroups && fetchedGroups.groups.length) {
        const descriptions = await this.admin.describeGroups(
          fetchedGroups.groups.map(entry => entry.groupId)
        );
        if (descriptions) {
          this.status.groups = descriptions.groups.map(group => {
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
      }
      this.emit('status', this.status);
      if (!this.isFirstCheck && !this.healthy) {
        this.healthy = true;
        this.emit('healthy');
      }
    } catch (error) {
      this.status = undefined;
      this.emit('status', this.status);
      const cause = Crash.from(error, this.componentId);
      const crash = new Crash(`Error checking the system: ${cause.message}`, this.componentId, {
        cause,
      });
      this.logger.error(crash.message);
      if (this.isFirstCheck) {
        this.emit('error', crash);
        // The first time we want only transmit the error, not the healthy event, but the next
        // times we want to transmit the healthy event if the system is not healthy
        this.healthy = true;
      } else if (this.healthy) {
        this.healthy = false;
        this.emit('unhealthy', crash);
      }
    } finally {
      // Stryker disable next-line all
      this.logger.silly(`STATUS: ${JSON.stringify(this.status, null, 2)}`);
      this.isFirstCheck = false;
    }
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
