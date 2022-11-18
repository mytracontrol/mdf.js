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
import { Logger } from '@mdf.js/logger';
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
  Response extends ServerResponse = ServerResponse
>(logger: Logger): Handler<Request, Response> {
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
  public static handler(logger: Logger): RequestHandler {
    return expressLogger(logger);
  }
}
