/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { LoggerInstance } from '@mdf.js/logger';
import { RequestHandler } from 'express';
import { IncomingMessage, ServerResponse } from 'http';
import morgan from 'morgan';

type Handler<Request extends IncomingMessage, Response extends ServerResponse> = (
  req: Request,
  res: Response,
  callback: (err?: Error) => void
) => void;

/**
 * Auxiliar function that map log levels to HTTP status codes
 * @param status - HTTP status code
 * @returns Log level for the HTTP status code
 */
function logLevelPerStatus(status: number): string {
  if (status >= 500) {
    return 'error';
  } else if (status >= 400 && status < 500) {
    return 'warn';
  } else {
    return 'debug';
  }
}
/**
 * Express middleware logger handler
 * @param color - colored output, note: only in NODE_ENV: development mode
 * @param stream - @netin-js/logger stream
 * @returns Express middleware handler
 */
function expressLogger<
  Request extends IncomingMessage = IncomingMessage,
  Response extends ServerResponse = ServerResponse,
>(logger: LoggerInstance): Handler<Request, Response> {
  return morgan<Request, Response>(
    (tokens: morgan.TokenIndexer<Request, Response>, req: Request, res: Response) => {
      const status = tokens['status'](req, res) || '-';
      const timestamp = tokens['date'](req, res, 'iso') || '-';
      let str = `HTTP/${tokens['http-version'](req, res)} `;
      str += `${tokens['method'](req, res)} `;
      str += `${status} `;
      str += `${tokens['url'](req, res)} - `;
      str += `${tokens['total-time'](req, res)} ms - `;
      str += `${tokens['res'](req, res, 'content-length')} bytes - `;
      str += `${tokens['remote-addr'](req, res)}`;
      return JSON.stringify({
        uuid: req.headers['X-Request-ID'],
        level: logLevelPerStatus(parseInt(status)),
        status,
        timestamp,
        context: 'express',
        message: str,
      });
    },
    { stream: logger.stream }
  );
}

export class LoggerMiddleware {
  /** Request logger middleware handler */
  public static handler(logger: LoggerInstance): RequestHandler {
    return expressLogger(logger);
  }
}
