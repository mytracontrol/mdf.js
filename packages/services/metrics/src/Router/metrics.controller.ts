/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { BoomHelpers } from '@mdf.js/crash';
import { coerce } from '@mdf.js/utils';
import cluster from 'cluster';
import { NextFunction, Request, Response } from 'express';
import { Service } from './metrics.service';

const TEXT_CONTENT_TYPE = 'text/plain';
const JSON_CONTENT_TYPE = 'application/json';

/** Controller class */
export class Controller {
  /** Services used by this controller */
  private readonly service: Service;
  /** Cluster mode flag */
  private readonly clusterMode: boolean;
  /**
   * Create an instance of Controller class
   * @param service - service instance
   * @param isCluster - indicates that the instance of this metrics service is running in a cluster
   */
  constructor(service: Service, clusterMode: boolean) {
    this.service = service;
    this.clusterMode = clusterMode;
  }
  /**
   * Return all the actual metrics of this artifact
   * @param request - HTTP request express object
   * @param response - HTTP response express object
   * @param next - Next express middleware function
   */
  public metrics(request: Request, response: Response, next: NextFunction): void {
    const requestCheck = this.isAcceptable(request);
    if (!requestCheck.acceptable) {
      next(
        BoomHelpers.notAcceptable(
          'Not valid formats for metrics endpoint are aceptable by the client',
          request.uuid,
          {
            source: {
              pointer: request.path,
              parameter: { body: request.body, query: request.query },
            },
          }
        )
      );
    } else {
      this.service
        .metrics(requestCheck.jsonFormat)
        .then(result => {
          response.set('Content-type', result.contentType);
          response.status(200).send(result.metrics);
        })
        .catch(next);
    }
  }
  /**
   * Check if the request is acceptable due to the format
   * @param request - HTTP request express object
   */
  private isAcceptable(request: Request): { acceptable: boolean; jsonFormat: boolean } {
    let jsonFormat: boolean = coerce(request.query['json'] as string, false);
    let acceptable = true;
    if (this.clusterMode && cluster.isPrimary) {
      jsonFormat = false;
      if (!request.accepts(TEXT_CONTENT_TYPE)) {
        acceptable = false;
      }
    } else {
      if (jsonFormat && request.accepts(JSON_CONTENT_TYPE)) {
        jsonFormat = true;
      } else if (request.accepts(TEXT_CONTENT_TYPE)) {
        jsonFormat = false;
      } else if (request.accepts(JSON_CONTENT_TYPE)) {
        jsonFormat = true;
      }
      if (!request.accepts([TEXT_CONTENT_TYPE, JSON_CONTENT_TYPE])) {
        acceptable = false;
      }
    }
    return { acceptable, jsonFormat };
  }
}
