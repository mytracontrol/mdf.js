/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import EventEmitter from 'events';
import { v4 } from 'uuid';

export interface ContainerOptions {
  /** The id of the container. If not set, a random id will be generated. */
  id?: string;
  non_fatal_errors?: string[];
  [key: string]: any;
}
export class Container extends EventEmitter {
  /** The id of the container. */
  public readonly id: string;
  /** SASL server mechanisms. */
  public saslServerMechanisms: any;
  /**
   * Creates a new instance of the Container class.
   * @param options - The options to create the container.
   */
  constructor(public readonly options: ContainerOptions = {}) {
    super();
    this.id = options.id ?? v4();
    this.saslServerMechanisms = options.saslServerMechanisms;
  }
  private dispatch(event: string, context: any): void {
    this.emit(event, context);
  }
}
