/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Crash } from '@mdf.js/crash';
import { LoggerInstance, Provider } from '@mdf.js/provider';
import axios, { AxiosBasicCredentials, AxiosInstance } from 'axios';
import { Receiver } from '../Client';
import { CONFIG_PROVIDER_BASE_NAME } from '../config';
import { ArtemisMonitor, Config } from '../types';
import { Receiver as RheaReceiver } from './types';
const DEFAULT_CHECK_CREDIT_INTERVAL = 10000;

export class Port extends Provider.Port<RheaReceiver, Config> {
  /** Receiver connection handler */
  private readonly instance: Receiver;
  /** Credit check interval */
  private timeInterval?: NodeJS.Timeout;
  /** Time out for credits check interval */
  private readonly interval: number;
  /** Artemis RESTapi client for monitoring purposes */
  private readonly artemisClient?: AxiosInstance;
  /** Artemis monitor body */
  private readonly monitorBodyRequest?: { type: 'read'; mbean: string };
  /**
   * Implementation of functionalities of an AMQP Receiver port instance.
   * @param config - Port configuration options
   * @param logger - Port logger, to be used internally
   */
  constructor(config: Config, logger: LoggerInstance) {
    super(config, logger, config.receiver_options?.name ?? CONFIG_PROVIDER_BASE_NAME);
    this.instance = new Receiver(config);
    this.interval = DEFAULT_CHECK_CREDIT_INTERVAL;
    if (config.monitor) {
      this.monitorBodyRequest = {
        type: 'read',
        mbean: this.getArtermisBean(config.monitor),
      };
      this.artemisClient = axios.create({
        timeout: config.monitor.timeout,
        auth: this.getArtemisAuth(config.monitor.username, config.monitor.password),
      });
    }
    // Stryker disable next-line all
    this.logger.debug(`New instance of AMQP Receiver port created: ${this.uuid}`);
  }
  /** Return the underlying port instance */
  public get client(): RheaReceiver {
    return this.instance.client;
  }
  /** Return the port state as a boolean value, true if the port is available, false in otherwise */
  public get state(): boolean {
    return this.instance.state;
  }
  /** Initialize the port instance */
  public async start(): Promise<void> {
    await this.instance.start();
    this.eventsWrapping(this.instance);
    await this.checkQueue();
    if (!this.timeInterval) {
      this.timeInterval = setInterval(this.checkQueue, this.interval);
    }
  }
  /** Stop the port instance */
  public async stop(): Promise<void> {
    await this.instance.stop();
    this.eventsUnWrapping(this.instance);
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
      this.timeInterval = undefined;
    }
  }
  /** Close the port instance */
  public async close(): Promise<void> {
    await this.stop();
  }
  /**
   * Create auth object for ActiveMQ Artemis
   * @param username - ActiveMQ Artemis username
   * @param password - ActiveMQ Artemis password
   * @returns
   */
  private getArtemisAuth(username?: string, password?: string): AxiosBasicCredentials | undefined {
    if (typeof username === 'string' && typeof password === 'string') {
      return { username, password };
    }
    return undefined;
  }
  /**
   * Create the mBean to be used in the Artemis Monitor
   * @param config - Artemis monitor configuration
   * @returns
   */
  private getArtermisBean(config: ArtemisMonitor): string {
    const addressParts: string[] = this.extractAddressConfig();
    const address = config.address ?? addressParts[0] ?? '*';
    const queue = config.queueName ?? addressParts[1] ?? '*';
    const mBeanBroker = `org.apache.activemq.artemis:broker="${config.brokerName}"`;
    const mBeamComponent = `component=addresses`;
    const mBeanAddress = `address="${address}"`;
    const mBeanSubComponent = `subcomponent=queues`;
    const mBeanRoutingType = `routing-type="${config.routingType}"`;
    const mBeanQueue = `queue="${queue}"`;
    return `${mBeanBroker},${mBeamComponent},${mBeanAddress},${mBeanSubComponent},${mBeanRoutingType},${mBeanQueue}`;
  }
  /**
   * Extract the value information from Artemis Monitor response
   * @param response - Response from the Artemis Monitor
   * @returns
   */
  private processMonitorResponse(
    response: Record<string, unknown>
  ): Record<string, unknown> | Record<string, unknown>[] {
    if (response) {
      const firstKey = Object.keys(response)[0];
      if (typeof firstKey === 'string' && firstKey.startsWith('org.apache.activemq.artemis')) {
        return Object.values(response) as Record<string, unknown>[];
      } else {
        return response;
      }
    } else {
      // Stryker disable next-line all
      this.logger.warn('No data in response');
      return {};
    }
  }
  /**
   * Extract the address parts from the target address
   * @returns
   */
  private extractAddressConfig(): string[] {
    if (typeof this.config.receiver_options?.source === 'string') {
      return this.config.receiver_options.source.split('::');
    } else if (typeof this.config.receiver_options?.source?.address === 'string') {
      return this.config.receiver_options.source.address.split('::');
    } else {
      return [];
    }
  }
  /**
   * Handler for the error event
   * @param error - Error instance
   */
  private readonly onErrorEvent = (error: Crash): void => {
    this.emit('error', error);
  };
  /**
   * Handler for the closed event
   * @param error - Error instance
   */
  private readonly onClosedEvent = (error: Crash): void => {
    this.emit('closed', error);
  };
  /** Handler for the healthy event */
  private readonly onHealthyEvent = (): void => {
    this.emit('healthy');
  };
  /**
   * Handler for the unhealthy event
   * @param error - Error instance
   */
  private readonly onUnhealthyEvent = (error: Crash): void => {
    this.emit('unhealthy', error);
  };
  /** Handler for the message event */
  private readonly checkQueue = async (): Promise<void> => {
    this.addCheck('credits', {
      componentId: this.uuid,
      observedValue: this.instance.client.credit,
      observedUnit: 'credits',
      status: this.instance.client.credit ? 'pass' : 'warn',
      output: this.instance.client.credit ? undefined : 'No credits available',
      time: new Date().toISOString(),
    });
    if (this.artemisClient) {
      try {
        const response = await this.artemisClient.post(
          this.config.monitor?.url as string,
          this.monitorBodyRequest
        );
        this.addCheck('artemis', {
          componentId: this.uuid,
          observedValue: this.processMonitorResponse(response.data.value),
          observedUnit: 'queue',
          status: 'pass',
          output: undefined,
          time: new Date().toISOString(),
        });
      } catch (rawError) {
        const error = Crash.from(rawError);
        this.addCheck('artemis', {
          componentId: this.uuid,
          observedValue: {},
          observedUnit: 'queue',
          status: 'fail',
          output: error.message,
          time: new Date().toISOString(),
        });
        this.emit('error', error);
      }
    }
  };
  /**
   * Attach all the events and log for debugging
   * @param instance - AMQP Receiver client instance
   */
  private eventsWrapping(instance: Receiver): Receiver {
    instance.on('error', this.onErrorEvent);
    instance.on('healthy', this.onHealthyEvent);
    instance.on('unhealthy', this.onUnhealthyEvent);
    instance.on('closed', this.onClosedEvent);
    return instance;
  }
  /**
   * Attach all the events and log for debugging
   * @param instance - AMQP Receiver client instance
   */
  private eventsUnWrapping(instance: Receiver): Receiver {
    instance.off('error', this.onErrorEvent);
    instance.off('healthy', this.onHealthyEvent);
    instance.off('unhealthy', this.onUnhealthyEvent);
    instance.off('closed', this.onClosedEvent);
    return instance;
  }
}
