/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Mytra Control S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Mytra Control S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Mytra Control S.L.
 */

import { v4 } from 'uuid';
import { Base } from '../BaseError';
import { Multi } from '../Multi';
import { Cause, CrashObject, CrashOptions } from '../types';

/**
 * Improved handling of standard errors.
 *
 * Crash helps us manage standard errors within our application by providing us with some tools:
 * - Association of errors and their causes in a hierarchical way.
 * - Simple search for root causes within the hierarchy of errors.
 * - Stack management, both of the current instance of the error, and of the causes.
 * - Facilitate error logging.
 *
 * In addition, in combination with the Multi error types, errors in validation processes, and Boom,
 * errors for the REST-API interfaces, it allows a complete management of the different types of
 * errors in our backend.
 * @category Crash
 * @public
 */
export class Crash extends Base {
  /** Crash error cause */
  private _cause?: Cause;
  /** Crash error */
  private readonly _isCrash = true;
  /**
   * Check if an object is a valid Crash or Multi error
   * @param error - error to be checked
   * @param uuid - Optional uuid to be used instead of a random one.
   * @returns
   */
  public static from(error: unknown, uuid?: string): Multi | Crash {
    if (error instanceof Crash || error instanceof Multi) {
      return error;
    } else if (error instanceof Error) {
      return new Crash(error.message, uuid || v4(), { cause: error, name: error.name });
    } else if (typeof error === 'string') {
      return new Crash(error, uuid || v4());
    } else if (
      error &&
      typeof error === 'object' &&
      typeof (error as Record<string, any>)['message'] === 'string'
    ) {
      return new Crash((error as Record<string, any>)['message']);
    } else {
      return new Crash(`Unexpected error type`, uuid || v4(), {
        info: { error },
      });
    }
  }
  /**
   * Create a new Crash error instance
   * @param message - human friendly error message
   */
  constructor(message: string);
  /**
   * Create a new Crash error
   * @param message - human friendly error message
   * @param options - enhanced error options
   */
  constructor(message: string, options: CrashOptions);
  /**
   * Create a new Crash error
   * @param message - human friendly error message
   * @param uuid - unique identifier for this particular occurrence of the problem
   */
  constructor(message: string, uuid: string);
  /**
   * Create a new Crash error
   * @param message - human friendly error message
   * @param uuid - unique identifier for this particular occurrence of the problem
   * @param options - enhanced error options
   */
  constructor(message: string, uuid: string, options: CrashOptions);
  constructor(message: string, uuid?: string | CrashOptions, options?: CrashOptions) {
    super(message, uuid, options);
    // *****************************************************************************************
    // #region options type safe
    if (this._options && this._options['cause']) {
      if (this._options['cause'] instanceof Crash || this._options['cause'] instanceof Error) {
        this._cause = this._options['cause'];
      } else {
        throw new Base('Parameter cause must be an Error/Crash', uuid);
      }
    }
    // #endregion
    if (this.name === 'BaseError') {
      this.name = 'CrashError';
    }
  }
  /** Determine if this instance is a Crash error */
  get isCrash(): boolean {
    return this._isCrash;
  }
  /** Cause source of error */
  get cause(): Cause | undefined {
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
   * Look in the nested causes of the error and return the first occurrence of a cause with the
   * indicated name
   * @param name - name of the error to search for
   * @returns the cause, if there is any present with that name
   */
  public findCauseByName(name: string): Cause | undefined {
    let cause = this._cause;
    while (cause) {
      if (cause.name === name) {
        return cause;
      } else if (cause instanceof Crash) {
        cause = cause.cause;
      } else {
        return undefined;
      }
    }
    return undefined;
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
   * description of the point in the code at which the Error/Crash was instantiated
   */
  public fullStack(): string | undefined {
    if (this._cause instanceof Crash) {
      return `${this.stack}\ncaused by ${this._cause.fullStack()}`;
    } else if (this._cause instanceof Error) {
      return `${this.stack}\ncaused by ${this._cause.stack}`;
    }
    return this.stack;
  }
  /** Return Crash error in JSON format */
  public toJSON(): CrashObject {
    return {
      ...super.toObject(),
      trace: this.trace(),
    };
  }
}
