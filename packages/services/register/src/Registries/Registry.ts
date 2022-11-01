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
import { Crash } from '@mdf/crash';
import Debug, { Debugger } from 'debug';
import { ErrorRecord, HandleableError } from '../types';

import { CONFIG_REGISTER_INCLUDE_STACK, CONFIG_REGISTER_MAX_LIST_SIZE } from '../const';

export abstract class Registry {
  /** Array of errors registered in this registry */
  protected _errors: ErrorRecord[] = [];
  /** Last update date */
  #lastUpdate: string = new Date().toISOString();
  /** Debugger logger */
  protected readonly logger: Debugger;
  /**
   * Create an instance of Registry class
   * @param maxSize - Maximum number of errors to be registered in this registry
   */
  constructor(protected readonly maxSize: number = CONFIG_REGISTER_MAX_LIST_SIZE) {
    // Stryker disable next-line all
    this.logger = Debug(`register`);
    if (maxSize < 1) {
      this.maxSize = CONFIG_REGISTER_MAX_LIST_SIZE;
    }
  }
  /**
   * Stored an error in the registry
   * @param error - Error to be stored
   */
  public push(error: HandleableError): void {
    const validatedError = Crash.from(error);
    let errorRecord: ErrorRecord;
    if (CONFIG_REGISTER_INCLUDE_STACK) {
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
    this.#lastUpdate = new Date().toISOString();
  }
  /** Get last update date */
  get lastUpdate(): string {
    return this.#lastUpdate;
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
