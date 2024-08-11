/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Cause } from '..';
import { Base } from '../BaseError';
import { HTTP_CODES } from '../const';
import { Crash } from '../Crash';
import { Multi } from '../Multi';
import { APIError, APISource, BoomOptions, ContextLink, Links, ValidationError } from '../types';

/**
 * Improved error handling in REST-API interfaces
 *
 *
 * Boom helps us with error responses (HTTP Codes 3XX-5XX) within our REST-API interface by
 * providing us with some tools:
 * - Helpers for the rapid generation of standard responses.
 * - Association of errors and their causes in a hierarchical way.
 * - Adaptation of validation errors of the Joi library.
 *
 * In addition, in combination with the Multi error types, errors in validation processes, and
 * Crash, standard application errors, it allows a complete management of the different types of
 * errors in our backend.
 * @category Boom
 * @public
 */
export class Boom extends Base {
  /** Boom error cause */
  private _cause?: Cause;
  /** Boom error code */
  private readonly _code: number;
  /** Links that leads to further details about this particular occurrence of the problem */
  private readonly _links?: Links;
  /** An object containing references to the source of the error */
  private readonly _source?: APISource;
  /** Boom error */
  private readonly _isBoom = true;
  /**
   * Create a new Boom error
   * @param message - human friendly error message
   * @param uuid - unique identifier for this particular occurrence of the problem
   * @param code - HTTP Standard error code
   * @param options - enhanced error options
   */
  constructor(message: string, uuid: string, code = 500, options?: BoomOptions) {
    super(message, uuid, {
      name: options?.cause?.name || 'HTTP',
      info: options?.info,
    });
    // *****************************************************************************************
    // #region code type safe
    if (typeof code !== 'number') {
      throw new Crash('Code must be a number', uuid);
    }
    this._code = code;
    // #endregion
    // *****************************************************************************************
    // #region options type safe
    this._cause = this.typeSafeCause(uuid, options?.cause);
    // #endregion
    if (!this.typeSafeLinks(options?.links) || !this.typeSafeSource(options?.source)) {
      throw new Crash('Links and source must be strings', uuid);
    }
    this._links = options?.links;
    this._source = options?.source;
    if (this.name === 'BaseError') {
      this.name = 'HTTPError';
    }
  }
  /** Return APIError in JSON format */
  public toJSON(): APIError {
    return {
      uuid: this._uuid,
      links: this._links,
      status: this._code,
      code: this.name,
      title: HTTP_CODES.get(this._code) || 'Undefined error',
      detail: this.message,
      source: this._source,
      meta: this._options?.info,
    };
  }
  /** Boom error code */
  public get status(): number {
    return this._code;
  }
  /**
   * Links that leads to further details about this particular occurrence of the problem.
   * A link MUST be represented as either:
   *  - self: a string containing the link’s URL
   *  - related: an object (“link object”) which can contain the following members:
   *    - href: a string containing the link’s URL.
   *    - meta: a meta object containing non-standard meta-information about the link.
   */
  public get links(): Links | undefined {
    return this._links;
  }
  /**
   * Object with the key information of the requested resource in the REST API context
   * @deprecated - `source` has been deprecated, use resource instead
   */
  public get source(): APISource | undefined {
    return this._source;
  }
  /** Object with the key information of the requested resource in the REST API context */
  public get resource(): APISource | undefined {
    return this._source;
  }
  /** Boom error */
  public get isBoom(): boolean {
    return this._isBoom;
  }
  /** Cause source of error */
  public override get cause(): Cause | undefined {
    return this._cause;
  }
  /** Get the trace of this hierarchy of errors */
  public trace(): string[] {
    const trace: string[] = [];
    let cause = this._cause;
    while (cause) {
      if (cause instanceof Multi) {
        trace.push(`caused by ${cause.toString()}`);
        if (cause.causes) {
          trace.push(...cause.causes.map(entry => `failed with ${entry.toString()}`));
        }
        cause = undefined;
      } else if (cause instanceof Crash) {
        trace.push(`caused by ${cause.toString()}`);
        cause = cause.cause;
      } else {
        trace.push(`caused by ${cause.name}: ${cause.message}`);
        cause = undefined;
      }
    }
    trace.unshift(this.toString());
    return trace;
  }
  /**
   * Transform joi Validation error in a Boom error
   * @param error - `ValidationError` from a Joi validation process
   * @param uuid - unique identifier for this particular occurrence of the problem
   */
  public Boomify(error: ValidationError): void {
    if (error.name === 'ValidationError') {
      if (error.details.length > 1) {
        this._cause = new Multi(error.message, this._uuid, { name: 'ValidationError' });
        (this._cause as Multi).Multify(error);
      } else {
        this._cause = new Crash(error.message, this._uuid, {
          name: 'ValidationError',
          info: error.details[0],
        });
      }
    }
  }
  /**
   * Check if the cause are type safe and valid
   * @param uuid - unique identifier for this particular occurrence of the problem
   * @param cause - Crash error cause
   */
  private typeSafeCause(uuid: string, cause?: Error | Crash): Error | Crash | undefined {
    if (cause) {
      if (cause instanceof Crash || cause instanceof Error) {
        return cause;
      } else {
        throw new Crash('Parameter cause must be an Error/Crash', uuid);
      }
    } else {
      return undefined;
    }
  }
  /**
   * Check if links are type safe and valid
   * @param links - Information links for error
   */
  private typeSafeLinks(links?: Links): boolean {
    if (typeof links === 'object') {
      let check = true;
      for (const key of Object.keys(links)) {
        if (typeof links[key] === 'object') {
          check = this.typeSafeContextLinks(links[key] as ContextLink);
        } else if (typeof links[key] !== 'string') {
          check = false;
        }
      }
      return check;
    } else if (links === undefined) {
      return true;
    } else {
      return false;
    }
  }
  /**
   * Check if links are type safe and valid
   * @param links - Information links for error
   */
  private typeSafeContextLinks(links?: ContextLink): boolean {
    if (typeof links === 'object') {
      let check = true;
      for (const key of Object.keys(links)) {
        if (typeof links[key] !== 'string') {
          check = false;
        }
      }
      return check;
    } else if (links === undefined) {
      return true;
    } else {
      return false;
    }
  }
  /**
   * Check if source are type safe and valid
   * @param source - Source of error
   */
  private typeSafeSource(source?: APISource): boolean {
    if (source !== undefined) {
      return typeof source.pointer === 'string';
    } else {
      return true;
    }
  }
}
