/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health } from '@mdf.js/core';
import { Crash, Links, Multi } from '@mdf.js/crash';
import { Service as HealthService } from '@mdf.js/health-service';
import { HTTP } from '@mdf.js/http-server-provider';
import { Service as MetricsService } from '@mdf.js/metrics-service';
import { Middleware } from '@mdf.js/middlewares';
import { Service as RegisterService } from '@mdf.js/register-service';
import { coerce } from '@mdf.js/utils';
import cluster from 'cluster';
import express, { Express, NextFunction, Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { merge } from 'lodash';
import { ObservabilityOptions } from './types';

const CONFIG_OBSERVABILITY_MASTER_PORT = coerce<number>(
  process.env['CONFIG_OBSERVABILITY_MASTER_PORT']
);
const DEFAULT_PRIMARY_PORT = 9080;

export class Observability {
  /** Observability app */
  private readonly app: Express;
  /** Observability server */
  private server?: HTTP.Provider;
  /** Services offered under observability instance */
  private readonly services: Health.Service[];
  /** Error registry service */
  public readonly registry: RegisterService;
  /** Metrics service */
  public readonly metrics: MetricsService;
  /** Health service */
  public readonly health: HealthService;
  /** Services router */
  public router: express.Router;
  /**
   * Create an instance of observability service
   * @param options - observability options
   */
  constructor(public readonly options: ObservabilityOptions) {
    this.health = HealthService.create(options, options.isCluster);
    this.metrics = MetricsService.create(options.isCluster);
    this.registry = RegisterService.create(options.maxSize, options.isCluster);
    this.services = [this.health, this.metrics, this.registry];
    this.health.on('error', this.onErrorEvent.bind(this));
    this.router = express.Router();
    this.app = !this.options.isCluster || cluster.isPrimary ? this.primaryApp() : this.workerApp();
  }
  /**
   * Register a new service in the observability
   * @param service - service to register
   */
  register(service: Health.Service): void {
    this.services.push(service);
  }
  /**
   * Error event handler
   * @param error - error to be registered
   */
  private readonly onErrorEvent = (error: Crash | Multi) => {
    this.registry.push(error);
  };
  /** Create an express app that offer all the services routes */
  private primaryApp(): Express {
    const app = express();
    app.use(Middleware.RequestId.handler());
    app.use(Middleware.BodyParser.JSONParserHandler());
    app.use(Middleware.Metrics.handler(this.metrics));
    app.use(
      `/v${this.options.version}`,
      (request: Request, response: Response, next: NextFunction) => {
        this.router(request, response, next);
      }
    );
    app.use(Middleware.ErrorHandler.handler());
    return app;
  }
  /** Create an express app that redirect all the request to the master */
  private workerApp(): Express {
    const app = express();
    app.use(
      '/',
      createProxyMiddleware({
        router: (request: Request) => {
          return `${request.protocol}://${request.hostname}:${this.getPrimaryPort()}`;
        },
        changeOrigin: false,
        logLevel: 'error',
      })
    );
    return app;
  }
  /** Define the port used offer the api */
  private getPrimaryPort(): number | undefined {
    if (CONFIG_OBSERVABILITY_MASTER_PORT) {
      return CONFIG_OBSERVABILITY_MASTER_PORT;
    }
    let primaryPort = this.options.port ? this.options.port : DEFAULT_PRIMARY_PORT;
    primaryPort = primaryPort > 1024 ? primaryPort : DEFAULT_PRIMARY_PORT;
    primaryPort = primaryPort <= 65535 ? primaryPort : DEFAULT_PRIMARY_PORT;
    return primaryPort;
  }
  /** Start the observability service */
  public async start(): Promise<void> {
    if (this.server) {
      return;
    }
    const router = express.Router();
    let formattedLinks: Links = {};
    for (const service of this.services) {
      if (typeof service.start === 'function') {
        await service.start.call(service);
      }
      if (typeof service.router !== 'undefined') {
        router.use(service.router);
      }
      if (typeof service.links !== 'undefined') {
        formattedLinks = merge(formattedLinks, service.links);
      }
    }
    router.use(Middleware.Default.handler(this.formatLinks(formattedLinks)));
    this.router = router;
    this.server = HTTP.Factory.create({
      name: 'observability',
      config: {
        app: this.app,
        port: cluster.isPrimary ? this.getPrimaryPort() : this.options.port,
        host: this.options.host,
      },
    });
    await this.server.start();
  }
  /** Stop the observability service */
  public async stop(): Promise<void> {
    if (!this.server) {
      return;
    }
    await this.server.stop();
    this.server = undefined;
    for (const service of this.services) {
      if (typeof service.stop === 'function') {
        await service.stop.call(service);
      }
    }
  }
  /**
   * Format the links to be used in the default handler
   * @param links - list of links to be formatted
   * @returns
   */
  private formatLinks(links?: Links): Links | undefined {
    let formattedLinks: Links | undefined = undefined;
    const baseRequestUrl = `/v${this.options.version}`;
    if (links) {
      formattedLinks = {};
      for (const [contextKey, firstLevel] of Object.entries(links)) {
        if (typeof firstLevel === 'string') {
          formattedLinks[contextKey] = `${baseRequestUrl}${firstLevel}`;
        } else {
          const formattedContextLinks: { [link: string]: string } = {};
          for (const [innerContextKey, secondLevel] of Object.entries(firstLevel)) {
            formattedContextLinks[innerContextKey] = `${baseRequestUrl}${secondLevel}`;
          }
          formattedLinks[contextKey] = formattedContextLinks;
        }
      }
    }
    return formattedLinks;
  }
}
