/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Cause } from '..';
import { Base } from '../BaseError';
import { Crash } from '../Crash';
import type { MultiObject, MultiOptions, ValidationError } from '../types';

/**
 * Improved handling of validation errors.
 *
 * Multi helps us to manage validation or information transformation errors, in other words, it
 * helps us manage any process that may generate multiple non-hierarchical errors (an error is not a
 * direct consequence of the previous one) by providing us with some tools:
 * - Management of the error stack.
 * - Simple search for root causes within the error stack.
 * - Stack management, both of the current instance of the error, and of the causes.
 * - Facilitate error logging.
 *
 * Furthermore, in combination with the types of error Boom, errors for the REST-API interfaces, and
 * Crash, standard application errors, it allows a complete management of the different types of
 * errors in our backend.
 * @category Multi
 * @public
 */
export class Multi extends Base {
  /** Multi error causes */
  private _causes?: Cause[];
  /** Multi error */
  private readonly _isMulti = true;
  /**
   * Create a new Multi error
   * @param message - human friendly error message
   */
  constructor(message: string);
  /**
   * Create a new Multi error
   * @param message - human friendly error message
   * @param options - enhanced error options
   */
  constructor(message: string, options: MultiOptions);
  /**
   * Create a new Multi error
   * @param message - human friendly error message
   * @param uuid - unique identifier for this particular occurrence of the problem
   */
  constructor(message: string, uuid: string);
  /**
   * Create a new Multi error
   * @param message - human friendly error message
   * @param uuid - unique identifier for this particular occurrence of the problem
   * @param options - enhanced error options
   */
  constructor(message: string, uuid: string, options: MultiOptions);
  constructor(message: string, uuidOrOptions?: string | MultiOptions, options?: MultiOptions) {
    super(message, uuidOrOptions, options);
    this._causes = this.extractCauses(this._uuid, this._options);
    if (this.name === 'BaseError') {
      this.name = 'MultiError';
    }
  }
  /**
   * Extract the causes from the options
   * @param uuid - unique identifier for this particular occurrence of the problem
   * enhanced error options
   * @param options - enhanced error options
   * @returns
   */
  private extractCauses(uuid: string, options?: MultiOptions): Cause[] | undefined {
    if (!options || options['causes'] === undefined) {
      return;
    }
    const causes = options['causes'];
    if (!(causes instanceof Crash || causes instanceof Error) && !Array.isArray(causes)) {
      throw new Base('Options[causes] must be an array of Error/Crash', uuid);
    }
    if (causes instanceof Crash || causes instanceof Error) {
      return [causes];
    }
    for (const cause of causes) {
      if (!(cause instanceof Crash || cause instanceof Error)) {
        throw new Base('Options[causes] must be an array of Error/Crash', uuid);
      }
    }
    return causes;
  }
  /** Determine if this instance is a Multi error */
  get isMulti(): boolean {
    return this._isMulti;
  }
  /** Causes source of error */
  get causes(): Array<Cause> | undefined {
    return this._causes;
  }
  /** Return the number of causes of this error */
  get size(): number {
    if (this._causes) {
      return this._causes.length;
    } else {
      return 0;
    }
  }
  /** Get the trace of this hierarchy of errors */
  public trace(): string[] {
    const trace: string[] = [];
    if (this.causes) {
      this.causes.forEach(cause => {
        if (cause instanceof Crash) {
          trace.push(...cause.trace());
        } else {
          trace.push(`${cause.name}: ${cause.message}`);
        }
      });
    }
    return trace;
  }
  /**
   * Look in the nested causes of the error and return the first occurrence of a cause with the
   * indicated name
   * @param name - name of the error to search for
   * @returns the cause, if there is any present with that name
   */
  public findCauseByName(name: string): Cause | undefined {
    let foundCause: Cause | undefined;
    if (this._causes !== undefined) {
      this._causes.forEach(cause => {
        if (cause.name === name && foundCause === undefined) {
          foundCause = cause;
        }
        if (cause instanceof Crash && foundCause === undefined) {
          foundCause = cause.findCauseByName(name);
        }
      });
    }
    return foundCause;
  }
  /**
   * Check if there is any cause in the stack with the indicated name
   * @param name - name of the error to search for
   * @returns Boolean value as the result of the search
   */
  public hasCauseWithName(name: string): boolean {
    return this.findCauseByName(name) !== undefined;
  }
  /**
   * Returns a full stack of the error and causes hierarchically. The string contains the
   * description of the point in the code at which the Error/Crash/Multi was instantiated
   */
  public fullStack(): string | undefined {
    let arrayStack = '';
    if (this._causes !== undefined && this._causes.length > 0) {
      arrayStack += '\ncaused by ';
      this._causes.forEach(cause => {
        if (cause instanceof Crash) {
          arrayStack += `\n[${cause.fullStack()}]`;
        } else if (cause instanceof Error) {
          arrayStack += `\n[${cause.stack}]`;
        }
      });
    }
    return this.stack + arrayStack;
  }
  /**
   * Add a new error on the array of causes
   * @param error - Cause to be added to the array of causes
   */
  public push(error: Cause): void {
    if (this._causes !== undefined) {
      this._causes.push(error);
    } else {
      this._causes = [error];
    }
  }
  /**
   * Remove a error from the array of causes
   * @returns the cause that have been removed
   */
  public pop(): Cause | undefined {
    if (this._causes !== undefined) {
      return this._causes.pop();
    } else {
      return undefined;
    }
  }
  /** Return Multi error in JSON format */
  public toJSON(): MultiObject {
    return {
      ...super.toObject(),
      trace: this.trace(),
    };
  }
  /**
   * Process the errors thrown by Joi into the cause array
   * @param error - `ValidationError` from a Joi validation process
   * @returns number or error that have been introduced
   */
  public Multify(error: ValidationError): number {
    if (error.name === 'ValidationError') {
      error.details.forEach(detail => {
        this.push(
          new Crash(detail.message, this._uuid, {
            name: 'ValidationError',
            info: detail,
          })
        );
      });
      return error.details.length;
    } else {
      return 0;
    }
  }
}
