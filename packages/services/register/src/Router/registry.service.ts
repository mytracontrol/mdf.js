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
import { Model } from './registry.model';

/** Service class */
export class Service {
  /** Model used by this service */
  readonly #model: Model;
  /**
   * Create an instance of service
   * @param model - model instance
   */
  constructor(model: Model) {
    this.#model = model;
  }
  /** Get all the error in the registry */
  public errors(): ErrorRecord[] {
    return this.#model.errors();
  }
}
