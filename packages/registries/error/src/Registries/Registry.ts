/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Crash } from '@mdf.js/crash';
import { ErrorRecord, HandleableError } from '../types';

import { DebugLogger, LoggerInstance } from '@mdf.js/logger';
import {
  DEFAULT_CONFIG_REGISTER_INCLUDE_STACK,
  DEFAULT_CONFIG_REGISTER_MAX_LIST_SIZE,
} from '../const';

export abstract class Registry {
  /** Array of errors registered in this registry */
  protected _errors: ErrorRecord[] = [];
  /** Last update date */
  private _lastUpdate: string = new Date().toISOString();
  /** Debugger logger */
  protected readonly logger: LoggerInstance;
  /**
   * Create an instance of Registry class
   * @param maxSize - Maximum number of errors to be registered in this registry
   * @param includeStack - Indicates if the stack trace should be included in the error record
   */
  constructor(
    protected readonly maxSize: number = DEFAULT_CONFIG_REGISTER_MAX_LIST_SIZE,
    protected readonly includeStack: boolean = DEFAULT_CONFIG_REGISTER_INCLUDE_STACK
  ) {
    // Stryker disable next-line all
    this.logger = new DebugLogger(`mdf:register`);
    if (maxSize < 1) {
      this.maxSize = DEFAULT_CONFIG_REGISTER_MAX_LIST_SIZE;
    }
  }
  /**
   * Stored an error in the registry
   * @param error - Error to be stored
   */
  public push(error: HandleableError): void {
    const validatedError = Crash.from(error);
    let errorRecord: ErrorRecord;
    if (this.includeStack) {
      errorRecord = {
        ...validatedError.toJSON(),
        stack: validatedError.fullStack(),
      };
    } else {
      errorRecord = validatedError.toJSON();
    }
    this._errors.push(errorRecord);
    if (this._errors.length > this.maxSize) {
      this._errors.shift();
    }
    this._lastUpdate = new Date().toISOString();
  }
  /** Get last update date */
  get lastUpdate(): string {
    return this._lastUpdate;
  }
  /** Get all the error in the registry */
  public abstract get errors(): ErrorRecord[];
  /** Get the number of error stored in the registry */
  public abstract get size(): number;
  /** Clear all the actual error in the registry */
  public abstract clear(): void;
  /** Start to polling errors registries from workers */
  public abstract start(): void;
  /** Stop polling errors registries from workers */
  public abstract stop(): void;
}
