/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Provider } from '@mdf.js/provider';
import { configEntry } from '../config';
import { Port } from './Port';
import { Client, Config, FactoryOptions, ProviderInstance } from './types';

export class Factory {
  /** Provider */
  private readonly provider: ProviderInstance;
  /**
   * Create a new Mongo provider
   * @param options - Provider configuration options
   */
  public static create(options?: FactoryOptions): ProviderInstance {
    return new Factory(options).provider;
  }
  /**
   * Private constructor for Mongo provider factory
   * @param options - Provider configuration options
   */
  private constructor(options?: FactoryOptions) {
    this.provider = new Provider.Manager<Client, Config, Port>(
      Port,
      {
        name: options?.name || 'mongo',
        type: 'database',
        validation: configEntry,
        useEnvironment: options?.useEnvironment ?? true,
        logger: options?.logger,
      },
      options?.config
    );
  }
}
