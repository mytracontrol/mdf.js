/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Layer } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { HTTP } from '@mdf.js/http-server-provider';
import { LoggerInstance } from '@mdf.js/logger';
import { findNodeModule } from '@mdf.js/utils';
import { instrument } from '@socket.io/admin-ui';
import express, { Express } from 'express';
import fs from 'fs';
import { Socket as IOSocket } from 'socket.io';
import { CONFIG_PROVIDER_BASE_NAME } from '../config';
import { Config, ConnectionError, Server } from './types';

/** Default Express app for the UI */
let CONFIG_SERVER_DEFAULT_APP: Express | undefined = undefined;
/** Default path for the UI */
const DEFAULT_DIST_PATH = findNodeModule('@socket.io');
/** Default configuration for the Socket.io server */
if (DEFAULT_DIST_PATH && fs.existsSync(DEFAULT_DIST_PATH)) {
  CONFIG_SERVER_DEFAULT_APP = express().use('/ui', express.static(DEFAULT_DIST_PATH));
}

export class Port extends Layer.Provider.Port<Server, Config> {
  /** Socket.io server handler */
  private readonly instance: Server;
  /** HTTP server provider instance */
  private readonly httpServer: HTTP.Provider;
  /** Event wrapping flags */
  private isWrapped: boolean;
  /**
   * Implementation of functionalities of an Socket.io server port instance.
   * @param config - Port configuration options
   * @param logger - Port logger, to be used internally
   */
  constructor(config: Config, logger: LoggerInstance) {
    super(config, logger, CONFIG_PROVIDER_BASE_NAME);
    this.httpServer = HTTP.Factory.create({
      name: this.name,
      logger: this.logger,
      config: {
        port: this.config.port,
        host: this.config.host,
        app: this.config.enableUI ? CONFIG_SERVER_DEFAULT_APP : undefined,
      },
    });
    if (this.config.enableUI) {
      this.config.transports = ['polling', 'websocket'];
    }
    this.instance = new Server(this.httpServer.client, this.config);
    if (this.config.enableUI) {
      instrument(this.instance, this.config.ui ?? { auth: false });
    }
    // Stryker disable next-line all
    this.logger.debug(`New instance of Socket.io server port: ${this.uuid}`, this.uuid, this.name);
    this.isWrapped = false;
  }
  /** Return the underlying port instance */
  public get client(): Server {
    return this.instance;
  }
  /** Return the port state as a boolean value, true if the port is available, false in otherwise */
  public get state(): boolean {
    return this.httpServer.client.listening;
  }
  /** Initialize the port instance */
  public async start(): Promise<void> {
    this.socketIOServerEventsWrapping(this.instance, this.httpServer);
    await this.httpServer.start();
  }
  /** Stop the port instance */
  public async stop(): Promise<void> {
    this.socketIOServerEventsUnwrapping(this.instance, this.httpServer);
    this.instance.disconnectSockets();
    await this.httpServer.stop();
  }
  /** Close the port instance */
  public async close(): Promise<void> {
    await this.stop();
  }
  /**
   * Auxiliar function to log and emit events
   * @param event - original event name
   * @param args - arguments to be emitted with the event
   */
  private onEvent(event: string, ...args: Crash[]): void {
    // Stryker disable next-line all
    this.logger.debug(`Event: ${event} was listened`);
    // Stryker enable all
    for (const arg of args) {
      // Stryker disable next-line all
      this.logger.silly(`Event ${event} arg: ${arg}`);
    }
  }
  /** Callback function for `error` event in the HTTP Provider */
  private readonly onErrorEvent = (error: Crash | Error) => {
    // Stryker disable next-line all
    this.logger.error(`Error event: error was wrapped to error`);
    this.emit('error', Crash.from(error));
  };
  /** Callback function for `connection` event in socket.io server */
  private readonly onConnectionEvent = (socket: IOSocket) => {
    // Stryker disable next-line all
    this.logger.debug(`New connection from ${socket.id}`);
    this.onEvent('connection');
  };
  /** Callback function for `connection_error` event in engine.io */
  private readonly onConnectionErrorEvent = (error: ConnectionError) => {
    // Stryker disable next-line all
    this.logger.debug(`Connection error: ${error.message}`);
    this.emit(
      'error',
      new Crash(`Connection error: ${error.message}`, {
        info: { code: error.code, context: error.context },
      })
    );
  };
  /**
   * Adapts the `server` instance events to standard Port events
   * @param instance - Server instance over which the events should be wrapped
   */
  private socketIOServerEventsWrapping(instance: Server, server: HTTP.Provider): void {
    if (this.isWrapped) {
      return;
    }
    instance.engine.on('connection_error', this.onConnectionErrorEvent);
    instance.on('connection', this.onConnectionEvent);
    server.on('error', this.onErrorEvent);
    this.isWrapped = true;
  }
  /**
   * Clean all the events handlers
   * @param instance - Server instance over which the events should be cleaned
   */
  private socketIOServerEventsUnwrapping(instance: Server, server: HTTP.Provider): void {
    instance.engine.off('connection_error', this.onConnectionErrorEvent);
    instance.off('connection', this.onConnectionEvent);
    server.off('error', this.onErrorEvent);
    this.isWrapped = false;
  }
}
