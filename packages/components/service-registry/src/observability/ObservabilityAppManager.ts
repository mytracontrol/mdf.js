/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Layer } from '@mdf.js/core';
import { Links } from '@mdf.js/crash';
import { HTTP } from '@mdf.js/http-server-provider';
import { Middleware } from '@mdf.js/middlewares';
import cluster from 'cluster';
import express, { Express } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { merge } from 'lodash';
import { Registry } from 'prom-client';
import { DEFAULT_PRIMARY_PORT, ObservabilityOptions } from './types';

/**
 * Manages the lifecycle and configuration of an Express application dedicated to observability.
 * This includes setting up middleware, routing, and server configuration.
 * It also supports dynamic registration of services and links for enhanced observability.
 */
export class ObservabilityAppManager {
  /** Express app */
  private _app: express.Express | undefined;
  /** Registries router */
  private _router: express.Router;
  /** Links offered by application */
  private _links: Links = {};
  /** HTTP server */
  private _server?: HTTP.Provider;
  /**
   * Create an instance of observability service
   * @param options - observability options
   * @param registry - registry to be used for endpoints metrics
   */
  constructor(
    public readonly options: ObservabilityOptions,
    private readonly registry: Registry
  ) {
    this._router = express.Router();
  }
  /** Indicates whether the server has been initialized. */
  public get isBuild(): boolean {
    return !!this._server;
  }
  /** Starts the server if it has been built. */
  public async start(): Promise<void> {
    await this._server?.start();
  }
  /** Stops the server if it is running. */
  public async stop(): Promise<void> {
    await this._server?.stop();
  }
  /** Constructs the server with the configured options. */
  public build(): void {
    if (this.isBuild) {
      return;
    }
    if (
      typeof this.options.service?.isCluster === 'boolean' &&
      this.options.service?.isCluster &&
      !cluster.isPrimary
    ) {
      this._app = this.workerApp();
    } else {
      this._app = this.primaryApp(
        this._router,
        this.registry,
        this.apiVersion,
        Middleware.Default.FormatLinks(this.apiVersion, this._links)
      );
    }
    this._server = HTTP.Factory.create({
      name: 'observability',
      config: {
        app: this._app,
        port: cluster.isPrimary
          ? this.getPrimaryPort(this.options.service?.primaryPort, this.options.service?.port)
          : this.options.service?.port,
        host: this.options.service?.host,
      },
    });
  }
  /** Resets the server to its initial state. */
  public unbuilt(): void {
    this._server = undefined;
    this._router = express.Router();
    this._links = {};
    this._app = undefined;
  }
  /** @returns The links offered by this service */
  public get links(): Links {
    return Middleware.Default.FormatLinks(`${this.baseURL}${this.apiVersion}`, this._links);
  }
  /** Registers a new service with the observability app. */
  public register(service: Layer.App.Service | Layer.App.Service[]): void {
    const _services = Array.isArray(service) ? service : [service];
    for (const service of _services) {
      if (typeof service.router !== 'undefined') {
        this.addRouter(service.router);
      }
      if (typeof service.links === 'object') {
        this.addLinks(service.links);
      }
    }
  }
  /** Get the base url whew the observability is served */
  private get baseURL(): string {
    const address = this._server?.client?.address();
    let baseURL: string;
    if (address) {
      if (typeof address === 'string') {
        baseURL = address;
      } else {
        baseURL = `http://${address.address}:${address.port}`;
      }
    } else {
      baseURL = '';
    }
    return baseURL;
  }
  /** Get the api version */
  private get apiVersion(): string {
    return `/v${this.options.metadata.version}`;
  }
  /** Add a new link to the observability */
  private addLinks(links: Links): void {
    this._links = merge(this._links, links);
  }
  /** Add a new router to the observability */
  private addRouter(router: express.Router): void {
    this._router.use(router);
  }
  /**
   * Create an express app that offer all the services routes
   * @param router - router to be used
   * @param registry - registry to be used for endpoints metrics
   * @param apiVersion - api version to be used
   * @param defaultLinks - default links to be used
   */
  private primaryApp(
    router: express.Router,
    registry: Registry,
    apiVersion: string,
    defaultLinks: Links
  ): Express {
    const app = express();
    app.use(Middleware.RequestId.handler());
    app.use(Middleware.BodyParser.JSONParserHandler());
    app.use(Middleware.Metrics.handler(registry));
    app.use(apiVersion, router);
    app.use(Middleware.Default.handler(defaultLinks));
    app.use(Middleware.ErrorHandler.handler());
    return app;
  }
  /** Create an express app that redirect all the request to the master */
  private workerApp(): Express {
    const app = express();
    app.use(
      createProxyMiddleware({
        router: () => `${this.baseURL}`,
        changeOrigin: true,
      })
    );
    return app;
  }
  /**
   * Define the port used offer the api
   * @param primaryPort - primary port to be used
   * @param port - port to be used
   */
  private getPrimaryPort(primaryPort?: number, port?: number): number {
    if (typeof primaryPort === 'number' && primaryPort > 0) {
      return primaryPort;
    } else if (typeof port === 'number' && port > 1024 && port <= 65535) {
      return port;
    } else {
      return DEFAULT_PRIMARY_PORT;
    }
  }
}
