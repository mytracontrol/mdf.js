/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Layer } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { LoggerInstance } from '@mdf.js/logger';
import { Socket } from 'dgram';
import { createServer, Server } from 'http';
import { createHttpTerminator } from 'http-terminator';
import { CONFIG_PROVIDER_BASE_NAME } from '../config';
import { Config } from './types';

export class Port extends Layer.Provider.Port<Server, Config> {
  /** Server handler */
  private readonly instance: Server;
  /** Server terminator */
  private readonly terminator;
  /**
   * Implementation of functionalities of an HTTP port instance.
   * @param config - Port configuration options
   * @param logger - Port logger, to be used internally
   */
  constructor(config: Config, logger: LoggerInstance) {
    super(config, logger, CONFIG_PROVIDER_BASE_NAME);
    this.instance = createServer(this.config.app);
    this.terminator = createHttpTerminator({
      server: this.instance,
      gracefulTerminationTimeout: 3000,
    });
    // Stryker disable next-line all
    this.logger.debug(`New instance of HTTP Server port: ${this.uuid}`);
  }
  /** Return the underlying port instance */
  public get client(): Server {
    return this.instance;
  }
  /** Return the port state as a boolean value, true if the port is available, false in otherwise */
  public get state(): boolean {
    return this.instance.listening;
  }
  /** Initialize the port instance */
  public start(): Promise<void> {
    if (this.instance.listening) {
      // Stryker disable next-line all
      this.logger.warn(`Port is already listening: ${this.config.host}:${this.config.port}`);
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const onError = (error: Error) => {
        this.instance.removeListener('listening', onListening);
        reject(this.errorParse(error));
      };
      const onListening = () => {
        this.instance.removeListener('error', onError);
        this.eventsWrapping(this.instance);
        resolve();
      };
      this.instance.once('error', onError);
      this.instance.once('listening', onListening);
      this.instance.listen(this.config.port, this.config.host);
    });
  }
  /** Stop the port instance */
  public async stop(): Promise<void> {
    this.eventsUnwrapping(this.instance);
    if (!this.instance.listening) {
      // Stryker disable next-line all
      this.logger.warn(`Port is not listening: ${this.config.host}:${this.config.port}`);
      return;
    }
    try {
      await this.terminator.terminate();
    } catch (rawError) {
      const error = Crash.from(rawError, this.uuid);
      const crashError = new Crash(`Error closing HTTP server: ${error.message}`, this.uuid, {
        cause: error,
      });
      // Stryker disable next-line all
      this.logger.crash(crashError);
      throw crashError;
    }
  }
  /** Close the port instance */
  public async close(): Promise<void> {
    await this.stop();
  }
  /** Callback function for `error` event */
  private readonly onErrorEvent = (error: NodeJS.ErrnoException) =>
    this.emit('error', this.errorParse(error));
  /** Callback function for `connection` event */
  private readonly onConnectionEvent = (socket: Socket) => {
    // Stryker disable next-line all
    this.logger.debug(`New connection from ${socket.remoteAddress}`);
  };
  /**
   * Transforms a ErrnoException instance to a Crash instance
   * @param error - Error to be parsed
   * @returns
   */
  private errorParse(error: NodeJS.ErrnoException): Crash {
    let message = error.message;
    /** Server address already is use EADDRINUSE */
    if (error.code === 'EADDRINUSE') {
      message = `Server address is already in used: ${this.config.host}:${this.config.port}`;
    }
    if (error.code === 'ERR_SERVER_ALREADY_LISTEN') {
      message = `Server is already listening on: ${this.config.host}:${this.config.port}`;
    }
    return new Crash(message, this.uuid, {
      name: error.name,
      cause: error,
      info: {
        uuid: this.uuid,
      },
    });
  }
  /**
   * Adapts the `server` instance events to standard Port events
   * @param instance - Server instance over which the events should be wrapped
   */
  private eventsWrapping(instance: Server): void {
    instance.on('connection', this.onConnectionEvent);
    instance.on('error', this.onErrorEvent);
  }
  /**
   * Clean all the events handlers
   * @param instance - Server instance over which the events should be cleaned
   */
  private eventsUnwrapping(instance: Server): void {
    instance.off('connection', this.onConnectionEvent);
    instance.off('error', this.onErrorEvent);
  }
}
