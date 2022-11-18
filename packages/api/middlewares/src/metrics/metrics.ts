/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Netin System S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Netin System S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Netin System S.L.
 */

import { Counter, Gauge, Histogram, MetricConfig, Service } from '@mdf.js/metrics-service';
import { NextFunction, Request, RequestHandler, Response } from 'express';

/** Global metric for API */
const METRICS_DEFINITIONS: Record<string, MetricConfig> = {
  api_all_request_total: {
    type: 'Counter',
    name: 'api_all_request_total',
    help: 'The total number of all API requests received',
  },
  api_all_info_total: {
    type: 'Counter',
    name: 'api_all_info_total',
    help: 'The total number of all API requests with informative response',
  },
  api_all_success_total: {
    type: 'Counter',
    name: 'api_all_success_total',
    help: 'The total number of all API requests with success response',
  },
  api_all_redirect_total: {
    type: 'Counter',
    name: 'api_all_redirect_total',
    help: 'The total number of all API requests with redirect response',
  },
  api_all_errors_total: {
    type: 'Counter',
    name: 'api_all_errors_total',
    help: 'The total number of all API requests with error response',
  },
  api_all_client_error_total: {
    type: 'Counter',
    name: 'api_all_client_error_total',
    help: 'The total number of all API requests with client error response',
  },
  api_all_server_error_total: {
    type: 'Counter',
    name: 'api_all_server_error_total',
    help: 'The total number of all API requests with server error response',
  },
  api_all_request_in_processing_total: {
    type: 'Gauge',
    name: 'api_all_request_in_processing_total',
    help: 'The total number of all API requests currently in processing (no response yet)',
  },
  /** API Operation counters, labeled with method, path and code */
  api_request_total: {
    type: 'Counter',
    name: 'api_request_total',
    help: 'The total number of all API requests',
    labelNames: ['method', 'path', 'code'],
  },
  /** API request duration histogram, labeled with method, path and code */
  api_request_duration_milliseconds: {
    type: 'Histogram',
    name: 'api_request_duration_milliseconds',
    help: 'API requests duration',
    labelNames: ['method', 'path', 'code'],
    buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
  },
  /** API request size histogram, labeled with method, path and code */
  api_request_size_bytes: {
    type: 'Histogram',
    name: 'api_request_size_bytes',
    help: 'API requests size',
    labelNames: ['method', 'path', 'code'],
    buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
  },
  /** API response size histogram, labeled with method, path and code */
  api_response_size_bytes: {
    type: 'Histogram',
    name: 'api_response_size_bytes',
    help: 'API requests size',
    labelNames: ['method', 'path', 'code'],
    buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
  },
};
/** Metric types */
type MetricInstances = {
  api_all_request_total: Counter;
  api_all_info_total: Counter;
  api_all_success_total: Counter;
  api_all_redirect_total: Counter;
  api_all_errors_total: Counter;
  api_all_client_error_total: Counter;
  api_all_server_error_total: Counter;
  api_all_request_in_processing_total: Gauge;
  api_request_total: Counter;
  api_request_duration_milliseconds: Histogram;
  api_request_size_bytes: Histogram;
  api_response_size_bytes: Histogram;
};
const CONTENT_LENGTH_HEADER = 'content-length';
/** MetricsExpressMiddleware middleware */
export class Metrics {
  /** Metrics service */
  #service: Service;
  /** Core and API metrics */
  #metrics: MetricInstances;
  /**
   * Return a metrics middleware instance
   * @param service - Metrics service interface
   */
  public static handler(service: Service): RequestHandler {
    return new Metrics(service).handler;
  }
  /**
   * Create a new instance of metrics express middleware class
   * @param service - Metrics service interface
   */
  private constructor(service: Service) {
    this.#service = service;
    this.#metrics = this.#service.setMetrics<MetricInstances>(METRICS_DEFINITIONS);
  }
  /** Return response status code class */
  private increaseCounterMetricByCode(code: number): void {
    if (!this.#service || !this.#metrics) {
      return;
    } else if (code < 200) {
      this.#metrics['api_all_info_total'].inc();
    } else if (code < 300) {
      this.#metrics['api_all_success_total'].inc();
    } else if (code < 400) {
      this.#metrics['api_all_redirect_total'].inc();
    } else if (code < 500) {
      this.#metrics['api_all_errors_total'].inc();
      this.#metrics['api_all_client_error_total'].inc();
    } else {
      this.#metrics['api_all_errors_total'].inc();
      this.#metrics['api_all_server_error_total'].inc();
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
      ? parseInt(request.headers[CONTENT_LENGTH_HEADER] as string)
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
      this.#metrics['api_all_request_total'].inc();
      this.#metrics['api_all_request_in_processing_total'].inc();
      const startDate = new Date().getTime();
      response.on('finish', () => {
        if (!this.#service || !this.#metrics) {
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
        this.#metrics['api_all_request_in_processing_total'].dec();
        this.increaseCounterMetricByCode(response.statusCode);
        this.#metrics['api_request_total'].inc(labels);
        this.#metrics['api_request_duration_milliseconds'].observe(labels, duration);
        this.#metrics['api_request_size_bytes'].observe(labels, contentLength.request);
        this.#metrics['api_response_size_bytes'].observe(labels, contentLength.response);
      });
      next();
    };
  }
}
