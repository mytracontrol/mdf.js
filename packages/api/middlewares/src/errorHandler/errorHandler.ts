/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Boom, BoomHelpers, BoomOptions, Crash, Multi } from '@mdf.js/crash';
import { Logger } from '@mdf.js/logger';
import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { HttpError, isHttpError as checkHttpError } from 'http-errors';
import { ValidationError as JoiError } from 'joi';
import { v4 } from 'uuid';

type PossibleErrorTypes = Error | Crash | Multi | Boom | JoiError | HttpError;

/**
 * Log the error
 * @param rawError - error to be logged
 * @param requestId - request identifier
 * @param logger - logger instance
 */
function logError(rawError: PossibleErrorTypes, requestId: string, logger?: Logger): void {
  if (!logger) {
    return;
  }
  // Stryker disable next-line all
  logger.crash(Crash.from(rawError, requestId), 'errorHandler');
}
/**
 * Generate boom options from the error and request
 * @param error - error to be transformed
 * @param req - request object
 * @returns
 */
function generateOptions(error: PossibleErrorTypes, req: Request): BoomOptions {
  return {
    source: {
      pointer: req.path,
      parameter: { body: req.body, query: req.query },
    },
    cause: error,
    name: error.name,
  };
}
/**
 * Transform an error to a Boom error
 * @param error - error to be transformed
 * @param options - boom error options
 * @param requestId - request identifier
 * @returns
 */
function transformError(error: PossibleErrorTypes, options: BoomOptions, requestId: string): Boom {
  if (error instanceof Boom) {
    return error;
  } else if (isJoiError(error)) {
    return manageJoiErrors(error, options, requestId);
  } else if (isApplicationError(error)) {
    return manageApplicationErrors(error, options, requestId);
  } else if (isHttpError(error)) {
    return manageHttpErrors(error, options, requestId);
  } else {
    return BoomHelpers.internalServerError('Internal Server Error', requestId, options);
  }
}
/** Check if the error is instance of a application Error */
function isApplicationError(error: unknown): error is Crash | Multi | Error {
  return (
    (error instanceof Crash || error instanceof Multi || error instanceof Error) &&
    !(error instanceof JoiError) &&
    !(error instanceof HttpError) &&
    !checkHttpError(error)
  );
}
/** Check if the error is instance of a Joi Error */
function isJoiError(error: unknown): error is JoiError {
  return (
    error instanceof JoiError &&
    'isJoi' in error &&
    !(error instanceof Crash) &&
    !(error instanceof Multi)
  );
}
/** Check if the error is instance of a Http Error */
function isHttpError(error: unknown): error is HttpError {
  return checkHttpError(error);
}
/**
 * We have several options, this means, several different types of error (error.name):
 *  - ValidationError: This error trigger from input (body) validation process, this means,
 *    validators in endpoints or database. It is translated as a 400 Bad Request respond.
 *    e.g.: Empty body.
 *  - Application: This error trigger from service's methods. This type usually triggers when
 *    data does not meet some expected conditions. It is translated as 500 Internal server
 *    error.
 *    e.g.: There are alarms in the database without location array
 *  - SystemError: This error could be triggered by Node.js or by the code. It indicates an
 *    error in the "system", e.g.: a system error will occurs if we try to access a file that
 *    does not exist, or accessing a database that is not connected. It is translated as 500
 *    Internal server error.
 *  - ReferenceError: Indicates that an attempt is being made to access a variable that is not
 *    defined. Such errors commonly indicate typos in code, or an otherwise broken program.
 *    It is translated as 500 Internal server error.
 *  - SyntaxError: Indicates that a program is not valid JavaScript. These errors may only be
 *    generated and propagated as a result of code evaluation. Code evaluation may happen as a
 *    result of eval, Function, require, or vm. These errors are almost always indicative of a
 *    broken program. It is translated as 500 Internal server error.
 *  - RangeError: Indicates that a provided argument was not within the set or range of
 *    acceptable values for a function; whether that is a numeric range, or outside the set of
 *    options for a given function parameter. It is translated as 500 Internal server error.
 * @param error - error to be managed
 * @param options - Boom options
 * @param requestId - request identifier
 * @returns
 */
function manageApplicationErrors(
  error: Error | Crash | Multi,
  options: BoomOptions,
  requestId: string
): Boom {
  switch (error.name) {
    case 'ValidationError':
      if ('isMulti' in error) {
        options = { ...options, info: { ...error.trace() } };
      }
      return BoomHelpers.badRequest(error.message, requestId, options);
    case 'ConflictError':
      return BoomHelpers.conflict(error.message, requestId, options);
    case 'ApplicationError':
      return BoomHelpers.internalServerError(error.message, requestId, options);
    case 'NotFound':
      return BoomHelpers.notFound(error.message, requestId, options);
    case 'ServiceUnavailable':
      return BoomHelpers.serverUnavailable(error.message, requestId, options);
    default:
      return BoomHelpers.internalServerError('Internal Server Error', requestId, options);
  }
}
/** Format Joi errors to Boom error */
function manageJoiErrors(error: JoiError, options: BoomOptions, requestId: string): Boom {
  const formatError = BoomHelpers.badRequest(error.message, requestId, options);
  formatError.Boomify(error);
  return formatError;
}
/** Format Http errors to Boom error */
function manageHttpErrors(error: HttpError, options: BoomOptions, requestId: string): Boom {
  return new Boom(error.message, requestId, error.statusCode, {
    ...options,
  });
}

export class ErrorHandler {
  /**
   * Return a error handler middleware instance
   * @param logger - logger instance
   * @returns
   */
  public static handler(logger?: Logger): ErrorRequestHandler {
    return (error: PossibleErrorTypes, req: Request, res: Response, next: NextFunction): void => {
      const requestId: string = req.uuid || (req.headers['x-request-id'] as string) || v4();
      const boomError = transformError(error, generateOptions(error, req), requestId);
      logError(error, requestId, logger);
      res.status(boomError.status).json(boomError);
    };
  }
}
