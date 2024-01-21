/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Layer } from '@mdf.js/core';
import { Crash, Multi } from '@mdf.js/crash';
import { LoggerInstance } from '@mdf.js/logger';
import { IConnackPacket, IDisconnectPacket, connect } from 'mqtt';
import { CONFIG_PROVIDER_BASE_NAME } from '../config';
import { Client, Config } from './types';

const DEFAULT_PING_CHECK_INTERVAL = 10000;

/** MQTT port implementation */
export class Port extends Layer.Provider.Port<Client, Config> {
  /** MQTT connection handler */
  private readonly instance: Client;
  /** Connection flag */
  private isConnected: boolean;
  /** Port health status */
  private isHealthy: boolean;
  /** Ping checker interval */
  private pingChecker: NodeJS.Timeout | undefined;
  /**
   * Implementation of functionalities of an MQTT port instance.
   * @param config - Port configuration options
   * @param logger - Port logger, to be used internally
   */
  constructor(config: Config, logger: LoggerInstance) {
    super(
      config,
      logger,
      typeof config.clientId === 'string' ? config.clientId : CONFIG_PROVIDER_BASE_NAME
    );
    const cleanedOptions: Config = { ...this.config, url: undefined, manualConnect: true };
    this.instance = connect(this.config.url as string, cleanedOptions);
    // Stryker disable next-line all
    this.logger.debug(`New instance of MQTT port created: ${this.uuid}`);
    this.isConnected = false;
    this.isHealthy = false;
  }
  /** Return the underlying port instance */
  public get client(): Client {
    return this.instance;
  }
  /** Return the port state as a boolean value, true if the port is available, false in otherwise */
  public get state(): boolean {
    return this.isConnected && this.instance.pingResp;
  }
  /** Initialize the port instance */
  public async start(): Promise<void> {
    if (this.isConnected) {
      // Stryker disable next-line all
      this.logger.warn(`Port already started`, this.uuid, this.name);
      return;
    }
    return new Promise((resolve, reject) => {
      const onConnect = (connectACK: IConnackPacket) => {
        this.instance.removeListener('error', onError);
        this.onConnect(connectACK);
        this.eventsWrapping(this.instance);
        this.pingChecker = setInterval(
          this.checkConnectionStatus,
          this.config.keepalive || DEFAULT_PING_CHECK_INTERVAL
        );
        resolve();
      };
      const onError = (error: Error) => {
        this.instance.removeListener('connect', onConnect);
        this.instance.end(true, () => {
          reject(this.onError(error));
        });
      };
      this.instance.once('connect', onConnect);
      this.instance.once('error', onError);
      this.instance.connect();
    });
  }
  /** Stop the port instance */
  public async stop(): Promise<void> {
    if (!this.isConnected) {
      // Stryker disable next-line all
      this.logger.warn(`Port already stopped`, this.uuid, this.name);
      return;
    }
    await this.instance.endAsync();
    this.onClose();
    this.eventsUnwrapping(this.instance);
    if (this.pingChecker) {
      clearInterval(this.pingChecker);
    }
  }
  /** Close the port instance */
  public async close(): Promise<void> {
    await this.stop();
  }
  /** Update the state of the ping response */
  private readonly checkConnectionStatus = () => {
    const shouldBeHealthy = this.isConnected && this.instance.pingResp;
    if (this.isHealthy === shouldBeHealthy) {
      return;
    } else {
      this.emit(shouldBeHealthy ? 'healthy' : 'unhealthy');
    }
    this.isHealthy = shouldBeHealthy;
  };
  /**
   * Manage the event of a new connection or reconnection to the MQTT broker.
   * @param connectACK - MQTT connection acknowledgement packet
   */
  private readonly onConnect = (connectACK: IConnackPacket) => {
    // Stryker disable next-line all
    this.logger.debug(`Port connected`, this.uuid, this.name, connectACK);
    this.isConnected = true;
  };
  /** Manage the event of a new reconnection to the MQTT broker. */
  private readonly onReconnect = () => {
    // Stryker disable next-line all
    this.logger.debug(`Port reconnecting`, this.uuid, this.name);
  };
  /** Manage the event of a new disconnection to the MQTT broker. */
  private readonly onClose = () => {
    // Stryker disable next-line all
    this.logger.debug(`Port disconnected`, this.uuid, this.name);
    this.isConnected = false;
  };
  /**
   * Manage the event of a new disconnection to the MQTT broker.
   * @param packet - MQTT disconnection packet
   */
  private readonly onDisconnect = (packet: IDisconnectPacket) => {
    // Stryker disable next-line all
    this.logger.debug(
      `Port disconnection request from broker: ${JSON.stringify(packet, null, 2)}`,
      this.uuid,
      this.name,
      packet
    );
  };
  /** Manage the event of a new offline state in the MQTT connection. */
  private readonly onOffline = () => {
    // Stryker disable next-line all
    this.logger.debug(`Port offline`, this.uuid, this.name);
  };
  /**
   * Manage the event of a new error in the MQTT connection.
   * @param rawError - Error object
   */
  private readonly onError = (rawError: Error): Crash | Multi => {
    const cause = Crash.from(rawError, this.uuid);
    this.logger.crash(cause, this.name);
    this.addCheck('lastError', {
      componentId: this.uuid,
      observedValue: cause.message,
      observedUnit: 'Last error',
      status: 'pass',
      output: cause.message,
      time: new Date().toISOString(),
    });
    if (this.isConnected) {
      this.emit('error', cause);
    }
    return cause;
  };
  /**
   * Attach all the events and log for debugging
   * @param instance - client where the event managers will be attached
   */
  private eventsWrapping(instance: Client) {
    instance.on('connect', this.onConnect);
    instance.on('reconnect', this.onReconnect);
    instance.on('close', this.onClose);
    instance.on('disconnect', this.onDisconnect);
    instance.on('offline', this.onOffline);
    instance.on('error', this.onError);
  }
  /**
   * Remove all the events listeners
   * @param instance - client where the event managers will be unattached
   */
  private eventsUnwrapping(instance: Client) {
    instance.off('connect', this.onConnect);
    instance.off('reconnect', this.onReconnect);
    instance.off('close', this.onClose);
    instance.off('disconnect', this.onDisconnect);
    instance.off('offline', this.onOffline);
    instance.off('error', this.onError);
  }
}
