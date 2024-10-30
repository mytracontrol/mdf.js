/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { NextFunction, Request, RequestHandler, Response } from 'express';
import { Counter, Gauge, Histogram, Registry, register } from 'prom-client';

/** Global metric for API */
const METRICS_DEFINITIONS = (prefix: string = '', registry: Registry): MetricInstances => {
  return {
    api_all_request_total:
      (registry.getSingleMetric(`${prefix}api_all_request_total`) as Counter | undefined) ??
      new Counter({
        name: `${prefix}api_all_request_total`,
        help: 'The total number of all API requests received',
        registers: [registry],
      }),
    api_all_info_total:
      (registry.getSingleMetric(`${prefix}api_all_info_total`) as Counter | undefined) ??
      new Counter({
        name: `${prefix}api_all_info_total`,
        help: 'The total number of all API requests with informative response',
        registers: [registry],
      }),
    api_all_success_total:
      (registry.getSingleMetric(`${prefix}api_all_success_total`) as Counter | undefined) ??
      new Counter({
        name: `${prefix}api_all_success_total`,
        help: 'The total number of all API requests with success response',
        registers: [registry],
      }),
    api_all_redirect_total:
      (registry.getSingleMetric(`${prefix}api_all_redirect_total`) as Counter | undefined) ??
      new Counter({
        name: `${prefix}api_all_redirect_total`,
        help: 'The total number of all API requests with redirect response',
        registers: [registry],
      }),
    api_all_errors_total:
      (registry.getSingleMetric(`${prefix}api_all_errors_total`) as Counter | undefined) ??
      new Counter({
        name: `${prefix}api_all_errors_total`,
        help: 'The total number of all API requests with error response',
        registers: [registry],
      }),
    api_all_client_error_total:
      (registry.getSingleMetric(`${prefix}api_all_client_error_total`) as Counter | undefined) ??
      new Counter({
        name: `${prefix}api_all_client_error_total`,
        help: 'The total number of all API requests with client error response',
        registers: [registry],
      }),
    api_all_server_error_total:
      (registry.getSingleMetric(`${prefix}api_all_server_error_total`) as Counter | undefined) ??
      new Counter({
        name: `${prefix}api_all_server_error_total`,
        help: 'The total number of all API requests with server error response',
        registers: [registry],
      }),
    api_all_request_in_processing_total:
      (registry.getSingleMetric(`${prefix}api_all_request_in_processing_total`) as
        | Gauge
        | undefined) ??
      new Gauge({
        name: `${prefix}api_all_request_in_processing_total`,
        help: 'The total number of all API requests currently in processing (no response yet)',
        registers: [registry],
      }),
    /** API Operation counters, labeled with method, path and code */
    api_request_total:
      (registry.getSingleMetric(`${prefix}api_request_total`) as Counter | undefined) ??
      new Counter({
        name: `${prefix}api_request_total`,
        help: 'The total number of all API requests',
        labelNames: ['method', 'path', 'code'],
        registers: [registry],
      }),
    /** API request duration histogram, labeled with method, path and code */
    api_request_duration_milliseconds:
      (registry.getSingleMetric(`${prefix}api_request_duration_milliseconds`) as
        | Histogram
        | undefined) ??
      new Histogram({
        name: `${prefix}api_request_duration_milliseconds`,
        help: 'API requests duration',
        labelNames: ['method', 'path', 'code'],
        registers: [registry],
        buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
      }),
    api_request_size_bytes:
      (registry.getSingleMetric(`${prefix}api_request_size_bytes`) as Histogram | undefined) ??
      new Histogram({
        name: `${prefix}api_request_size_bytes`,
        help: 'API requests size',
        labelNames: ['method', 'path', 'code'],
        registers: [registry],
        buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
      }),
    api_response_size_bytes:
      (registry.getSingleMetric(`${prefix}api_response_size_bytes`) as Histogram | undefined) ??
      new Histogram({
        name: `${prefix}api_response_size_bytes`,
        help: 'API requests size',
        labelNames: ['method', 'path', 'code'],
        registers: [registry],
        buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
      }),
  };
};
/** Metric types */
type MetricInstances = {
  /** The total number of all API requests received */
  api_all_request_total: Counter;
  /** The total number of all API requests with informative response */
  api_all_info_total: Counter;
  /** The total number of all API requests with success response */
  api_all_success_total: Counter;
  /** The total number of all API requests with redirect response */
  api_all_redirect_total: Counter;
  /** The total number of all API requests with error response */
  api_all_errors_total: Counter;
  /** The total number of all API requests with client error response */
  api_all_client_error_total: Counter;
  /** The total number of all API requests with server error response */
  api_all_server_error_total: Counter;
  /** The total number of all API requests currently in processing (no response yet) */
  api_all_request_in_processing_total: Gauge;
  /** The total number of all API requests */
  api_request_total: Counter;
  /** API requests duration */
  api_request_duration_milliseconds: Histogram;
  /** API requests size */
  api_request_size_bytes: Histogram;
  /** API requests size */
  api_response_size_bytes: Histogram;
};
const CONTENT_LENGTH_HEADER = 'content-length';
/** MetricsExpressMiddleware middleware */
export class MetricsMiddleware {
  /** Core and API metrics */
  private readonly metrics: MetricInstances;
  /**
   * Return a metrics middleware instance
   * @param prefix - Metrics prefix
   */
  public static handler(prefix?: string): RequestHandler;
  /**
   * Return a metrics middleware instance
   * @param registry - Metrics registry interface
   * @param prefix - Metrics prefix
   */
  public static handler(registry?: Registry, prefix?: string): RequestHandler;
  public static handler(registry?: Registry | string, prefix?: string): RequestHandler {
    if (typeof registry === 'string') {
      return new MetricsMiddleware(undefined, registry).handler;
    } else {
      return new MetricsMiddleware(registry, prefix).handler;
    }
  }
  /**
   * Create a new instance of metrics express middleware class
   * @param registry - Metrics registry interface
   * @param prefix - Metrics prefix
   */
  private constructor(
    private readonly registry: Registry = register,
    prefix: string = ''
  ) {
    this.metrics = METRICS_DEFINITIONS(prefix, this.registry);
  }
  /** Return response status code class */
  private increaseCounterMetricByCode(code: number): void {
    if (!this.registry || !this.metrics) {
      return;
    } else if (code < 200) {
      this.metrics['api_all_info_total'].inc();
    } else if (code < 300) {
      this.metrics['api_all_success_total'].inc();
    } else if (code < 400) {
      this.metrics['api_all_redirect_total'].inc();
    } else if (code < 500) {
      this.metrics['api_all_errors_total'].inc();
      this.metrics['api_all_client_error_total'].inc();
    } else {
      this.metrics['api_all_errors_total'].inc();
      this.metrics['api_all_server_error_total'].inc();
    }
  }
  /**
   * Return the content length for request and response objects
   * @param request - HTTP request express object
   * @param response - HTTP response express object
   */
  private getContentLength(
    request: Request,
    response: Response
  ): { request: number; response: number } {
    const reqHeaderContentLength = request.headers[CONTENT_LENGTH_HEADER]
      ? parseInt(request.headers[CONTENT_LENGTH_HEADER])
      : 0;
    const resHeaderContentLength = response.getHeader(CONTENT_LENGTH_HEADER);
    let responseLength: number;
    if (typeof resHeaderContentLength === 'string') {
      const parsedLength = parseInt(resHeaderContentLength);
      responseLength = Number.isNaN(parsedLength) ? 0 : parsedLength;
    } else if (typeof resHeaderContentLength === 'number') {
      responseLength = resHeaderContentLength;
    } else {
      responseLength = 0;
    }
    return { request: reqHeaderContentLength, response: responseLength };
  }
  /**
   * Express handler function
   * @param request - HTTP request express object
   * @param response - HTTP response express object
   * @param next - Next express middleware function
   */
  private get handler(): RequestHandler {
    return (request: Request, response: Response, next: NextFunction): void => {
      this.metrics['api_all_request_total'].inc();
      this.metrics['api_all_request_in_processing_total'].inc();
      const startDate = new Date().getTime();
      response.on('finish', () => {
        if (!this.registry || !this.metrics) {
          return;
        }
        const labels = {
          method: request.method,
          path: request.route ? request.route.path : request.originalUrl,
          code: response.statusCode,
        };
        const endDate = new Date().getTime();
        const duration = endDate - startDate;
        const contentLength = this.getContentLength(request, response);
        this.metrics['api_all_request_in_processing_total'].dec();
        this.increaseCounterMetricByCode(response.statusCode);
        this.metrics['api_request_total'].inc(labels);
        this.metrics['api_request_duration_milliseconds'].observe(labels, duration);
        this.metrics['api_request_size_bytes'].observe(labels, contentLength.request);
        this.metrics['api_response_size_bytes'].observe(labels, contentLength.response);
      });
      next();
    };
  }
}

