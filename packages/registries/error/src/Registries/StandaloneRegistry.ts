/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { ErrorRecord } from '../types';
import { Registry } from './Registry';

export class StandaloneRegistry extends Registry {
  /**
   * Create an instance of StandaloneRegistry
   * @param maxSize - Maximum number of errors to be registered in this registry
   */
  constructor(maxSize?: number) {
    super(maxSize);
  }
  /** Get all the error in the registry */
  public get errors(): ErrorRecord[] {
    return this._errors;
  }
  /** Get the number of error stored in the registry */
  public get size(): number {
    return this._errors.length;
  }
  /** Clear all the actual error in the registry */
  public clear(): void {
    this._errors = [];
  }
  /** Start to polling errors registries from workers */
  public start(): void {
    // Stryker disable next-line all
    this.logger.debug('Starting registry');
  }
  /** Stop polling errors registries from workers */
  public stop(): void {
    // Stryker disable next-line all
    this.logger.debug('Stopping registry');
  }
}
