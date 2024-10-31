/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Layer } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { LoggerInstance } from '@mdf.js/logger';
import { io } from 'socket.io-client';
import { CONFIG_PROVIDER_BASE_NAME } from '../config';
import { Client, Config } from './types';

interface ExtendedError extends Error {
  data?: any;
}
export class Port extends Layer.Provider.Port<Client, Config> {
  /** Client handler */
  private readonly instance: Client;
  /**
   * Implementation of functionalities of an HTTP client port instance.
   * @param config - Port configuration options
   * @param logger - Port logger, to be used internally
   */
  constructor(config: Config, logger: LoggerInstance) {
    super(config, logger, CONFIG_PROVIDER_BASE_NAME);
    this.instance = io(this.config.url as string, {
      ...config,
      autoConnect: false,
      reconnection: config.reconnection ?? true,
    });
    // Stryker disable next-line all
    this.logger.debug(`New instance of Socket.IO Client port: ${this.uuid}`, this.uuid, this.name);
  }
  /** Return the underlying port instance */
  public get client(): Client {
    return this.instance;
  }
  /** Return the port state as a boolean value, true if the port is available, false in otherwise */
  public get state(): boolean {
    return this.instance.connected;
  }
  /** Initialize the port instance */
  public start(): Promise<void> {
    if (this.instance.connected) {
      // Stryker disable next-line all
      this.logger.warn(`Port is already connected: ${this.config.host}:${this.config.port}`);
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const onConnect = () => {
        this.instance.removeListener('connect_error', onConnectError);
        this.instance.io.removeListener('reconnect_failed', onLastFail);
        this.eventsWrapping(this.instance);
        resolve();
      };
      this.instance.once('connect', onConnect);

      const onConnectError = (error: ExtendedError) => {
        // Stryker disable next-line all
        this.logger.error(error.message);
        if (error.data?.status) {
          onLastFail(
            new Crash(`Connection error: ${error.message}, client validation error`, {
              info: error.data,
            })
          );
        } else if (this.config.reconnection === false) {
          onLastFail(new Crash(`Connection error: ${error.message}, no reconnect is configured`));
        }
      };
      const onLastFail = (error?: Crash) => {
        // Stryker disable next-line all
        this.logger.error(`Initial connection error`);
        this.instance.removeListener('connect', onConnect);
        this.instance.removeListener('connect_error', onConnectError);
        this.instance.io.removeListener('reconnect_failed', onLastFail);
        reject(error || new Crash('Socket.IO Client connection error'));
      };
      this.instance.on('connect_error', onConnectError);
      this.instance.io.on('reconnect_failed', onLastFail);
      this.instance.connect();
    });
  }
  /** Stop the port instance */
  public stop(): Promise<void> {
    this.eventsUnwrapping(this.instance);
    if (!this.instance.connected) {
      // Stryker disable next-line all
      this.logger.warn(`Port is not connected: ${this.config.host}:${this.config.port}`);
      return Promise.resolve();
    }
    return new Promise(resolve => {
      const onDisconnect = (reason: string) => {
        // Stryker disable next-line all
        this.logger.debug(`Port disconnected: ${reason}`);
        resolve();
      };
      this.instance.once('disconnect', onDisconnect);
      this.instance.close();
    });
  }
  /** Close the port instance */
  public async close(): Promise<void> {
    await this.stop();
  }
  /** Event handler for the `connect` event */
  private readonly onConnectEvent = () => this.emit('healthy');
  /** Event handler for the `disconnect` event */
  private readonly onDisconnectEvent = (reason: string) => {
    // Stryker disable next-line all
    this.logger.debug(`Port disconnected: ${reason}`);
    if (!reason.includes('disconnect')) {
      this.emit('unhealthy', new Crash(`Socket.IO Client connection error: ${reason}`));
    }
  };
  /**
   * Adapts the `client` instance events to standard Port events
   * @param instance - Client instance over which the events should be wrapped
   */
  private eventsWrapping(instance: Client): void {
    instance.on('connect', this.onConnectEvent);
    instance.on('disconnect', this.onDisconnectEvent);
  }
  /**
   * Clean all the events handlers
   * @param instance - Client instance over which the events should be cleaned
   */
  private eventsUnwrapping(instance: Client): void {
    instance.off('connect', this.onConnectEvent);
    instance.off('disconnect', this.onDisconnectEvent);
  }
}
