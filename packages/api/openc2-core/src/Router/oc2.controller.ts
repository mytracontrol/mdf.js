/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Boom, BoomHelpers } from '@mdf.js/crash';
import { NextFunction, Request, Response } from 'express';
import { Control } from '../types';
import { Service } from './oc2.service';

/** Controller class */
export class Controller {
  /**
   * Create an instance of Controller class
   * @param service - service instance
   */
  constructor(private readonly service: Service) {}
  /**
   * Return array of messages, pendingJobs and jobs used as fifo registry
   * @param request - HTTP request express object
   * @param response - HTTP response express object
   * @param next - Next express middleware function
   */
  public query(request: Request, response: Response, next: NextFunction): void {
    let selector: Promise<any[]> | undefined;
    const param = request.params['id'];
    switch (param) {
      case 'jobs':
        selector = this.service.jobs();
        break;
      case 'messages':
        selector = this.service.messages();
        break;
      case 'pendingJobs':
        selector = this.service.pendingJobs();
        break;
      default:
        selector = undefined;
    }
    if (!selector) {
      next(BoomHelpers.badRequest(`Invalid parameter ${param}`, request.uuid));
    } else {
      selector
        .then(result => {
          if (result.length > 0) {
            response.status(200).json(result);
          } else {
            response.status(204).send();
          }
        })
        .catch(next);
    }
  }
  /**
   * Execute a command over the producer or consumer
   * @param request - HTTP request express object
   * @param response - HTTP response express object
   * @param next - Next express middleware function
   * @returns - response message
   */
  public command(request: Request, response: Response, next: NextFunction): void {
    this.service
      .command(request.body)
      .then(result => {
        if (Array.isArray(result)) {
          if (result.length > 0) {
            response.status(200).json(result);
          } else {
            response.status(204).send();
          }
        } else if (result) {
          if (
            result.status === Control.StatusCode.Processing ||
            result.status === Control.StatusCode.OK
          ) {
            response.status(200).json(result);
          } else {
            throw this.OC2ResponseToHTTPResponse(result);
          }
        } else {
          response.status(204).send();
        }
      })
      .catch(next);
  }
  /**
   * Return a Boom object from a OC2 response
   * @param response - OC2 response
   * @returns - Boom object
   */
  private OC2ResponseToHTTPResponse(response: Control.ResponseMessage): Boom {
    switch (response.status) {
      case Control.StatusCode.BadRequest:
        return BoomHelpers.badRequest(
          response.content.status_text || 'Bad OC2 Request',
          response.request_id,
          { info: response }
        );
      case Control.StatusCode.Unauthorized:
        return BoomHelpers.unauthorized(
          response.content.status_text || 'Unauthorized OC2 Request',
          response.request_id,
          { info: response }
        );
      case Control.StatusCode.Forbidden:
        return BoomHelpers.forbidden(
          response.content.status_text || 'Forbidden OC2 Request',
          response.request_id,
          { info: response }
        );
      case Control.StatusCode.NotFound:
        return BoomHelpers.notFound(
          response.content.status_text || 'Not Found OC2 Request',
          response.request_id,
          { info: response }
        );
      case Control.StatusCode.NotImplemented:
        return BoomHelpers.notImplemented(
          response.content.status_text || 'Not Implemented OC2 Request',
          response.request_id,
          { info: response }
        );
      case Control.StatusCode.ServiceUnavailable:
        return BoomHelpers.serverUnavailable(
          response.content.status_text || 'Service Unavailable OC2 Request',
          response.request_id,
          { info: response }
        );
      default:
        return BoomHelpers.internalServerError(
          response.content.status_text || 'Unknown OC2 response status code',
          response.request_id,
          { info: response }
        );
    }
  }
}
