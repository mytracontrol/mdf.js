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
    this.logger('Starting registry');
  }
  /** Stop polling errors registries from workers */
  public stop(): void {
    // Stryker disable next-line all
    this.logger('Stopping registry');
  }
}
